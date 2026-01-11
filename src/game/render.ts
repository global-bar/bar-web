// Canvas rendering with cyberpunk/pixel aesthetic

import type { WorldState, UserEntity } from './world';
import { CharacterSprite, DEFAULT_CHARACTER_CONFIG } from './sprites/CharacterSprite';
import { TilemapRenderer } from './tilemap/TilemapRenderer';
import { BAR_TILEMAP } from './tilemap/barMap';

// Colors - Cyberpunk palette (fallback)
const COLORS = {
  background: '#070712',
  gridLine: 'rgba(0, 255, 255, 0.08)',
  playerBody: '#00ff9f', // Neon green for self
  otherBody: '#ff2bd6', // Neon magenta for others
  head: '#d9d9ff',
  bubbleBg: 'rgba(0, 0, 0, 0.85)',
  bubbleBorder: 'rgba(0, 255, 255, 0.6)',
  bubbleText: '#ffffff',
  nickname: '#aaaaaa',
};

// Grid size
const GRID_SIZE = 48;

// Avatar dimensions (fallback)
const AVATAR = {
  bodyWidth: 24,
  bodyHeight: 30,
  headWidth: 18,
  headHeight: 18,
};

// Sprite systems (initialized lazily)
let characterSprite: CharacterSprite | null = null;
let tilemapRenderer: TilemapRenderer | null = null;
let assetsInitialized = false;


// Initialize sprite and tilemap assets
export async function initRenderAssets(): Promise<void> {
  if (assetsInitialized) return;

  try {
    // Initialize character sprite
    characterSprite = new CharacterSprite(DEFAULT_CHARACTER_CONFIG);
    await characterSprite.load();

    // Initialize tilemap
    tilemapRenderer = new TilemapRenderer(BAR_TILEMAP);
    await tilemapRenderer.loadAssets();
    tilemapRenderer.buildFloorCache();

    assetsInitialized = true;
    console.log('Render assets loaded successfully');
  } catch (e) {
    console.warn('Failed to load render assets, using fallback:', e);
  }
}


// Track moving state per user to prevent flickering
const userMovingState: Map<string, { moving: boolean; lastMoveTime: number }> = new Map();
const MOVE_THRESHOLD = 1.5; // 이동 감지 임계값
const STOP_DELAY_MS = 150; // 멈춤 판정까지 딜레이

// Check if user is moving (with hysteresis to prevent flickering)
function isUserMoving(user: UserEntity): boolean {
  const dx = Math.abs(user.pos.x - user.renderPos.x);
  const dy = Math.abs(user.pos.y - user.renderPos.y);
  const isCurrentlyMoving = dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD;

  const now = Date.now();
  let state = userMovingState.get(user.userId);

  if (!state) {
    state = { moving: false, lastMoveTime: 0 };
    userMovingState.set(user.userId, state);
  }

  if (isCurrentlyMoving) {
    state.moving = true;
    state.lastMoveTime = now;
  } else if (state.moving && now - state.lastMoveTime > STOP_DELAY_MS) {
    state.moving = false;
  }

  return state.moving;
}

// Draw grid background (fallback)
function drawGrid(ctx: CanvasRenderingContext2D, size: { w: number; h: number }) {
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= size.w; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size.h);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= size.h; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size.w, y);
    ctx.stroke();
  }
}

// Draw a single user avatar (fallback)
function drawAvatarFallback(
  ctx: CanvasRenderingContext2D,
  user: UserEntity,
  isMe: boolean
) {
  const x = Math.round(user.renderPos.x);
  const y = Math.round(user.renderPos.y);

  // Body
  ctx.fillStyle = isMe ? COLORS.playerBody : COLORS.otherBody;
  ctx.fillRect(
    x - AVATAR.bodyWidth / 2,
    y - AVATAR.bodyHeight,
    AVATAR.bodyWidth,
    AVATAR.bodyHeight
  );

  // Head
  ctx.fillStyle = COLORS.head;
  ctx.fillRect(
    x - AVATAR.headWidth / 2,
    y - AVATAR.bodyHeight - AVATAR.headHeight,
    AVATAR.headWidth,
    AVATAR.headHeight
  );

  // Glow effect for player
  if (isMe) {
    ctx.shadowColor = COLORS.playerBody;
    ctx.shadowBlur = 8;
    ctx.fillStyle = COLORS.playerBody;
    ctx.fillRect(
      x - AVATAR.bodyWidth / 2,
      y - AVATAR.bodyHeight,
      AVATAR.bodyWidth,
      AVATAR.bodyHeight
    );
    ctx.shadowBlur = 0;
  }
}

// Global animation using absolute time (not delta-based)
const ANIM_FRAME_DURATION = 500; // 0.5초마다 프레임 전환

function getGlobalAnimFrame(): number {
  return Math.floor(Date.now() / ANIM_FRAME_DURATION) % 2;
}

// Draw character (sprite or fallback)
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  user: UserEntity,
  isMe: boolean,
  _deltaMs: number
) {
  const sprite = characterSprite?.isReady() ? characterSprite : null;

  if (sprite) {
    const moving = isUserMoving(user);
    sprite.update(0, moving, user.direction);
    sprite.setFrame(getGlobalAnimFrame());
    sprite.draw(ctx, user.renderPos.x, user.renderPos.y, isMe);
  } else {
    drawAvatarFallback(ctx, user, isMe);
  }

  // Nickname below character
  if (user.nickname) {
    ctx.fillStyle = COLORS.nickname;
    ctx.font = '14px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(user.nickname.slice(0, 12), user.renderPos.x, user.renderPos.y + 18);
  }
}

// Wrap text into multiple lines based on max width
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text) {
    const testLine = currentLine + char;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

// Draw chat bubble
function drawBubble(
  ctx: CanvasRenderingContext2D,
  user: UserEntity
) {
  if (!user.bubble || user.bubble.expiresAtMs <= Date.now()) {
    return;
  }

  const x = Math.round(user.renderPos.x);
  const y = Math.round(user.renderPos.y);

  const fontSize = 10;
  const lineHeight = 14;
  const maxWidth = 120;
  const maxLines = 3;
  const paddingX = 10;
  const paddingY = 6;

  ctx.font = `${fontSize}px "Noto Sans KR", "Apple SD Gothic Neo", sans-serif`;

  const lines = wrapText(ctx, user.bubble.text, maxWidth, maxLines);
  const actualMaxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));

  const bubbleWidth = Math.max(actualMaxWidth + paddingX * 2, 40);
  const bubbleHeight = lines.length * lineHeight + paddingY * 2;
  const bubbleY = y - AVATAR.bodyHeight - AVATAR.headHeight - bubbleHeight - 12;
  const bubbleX = x - bubbleWidth / 2;

  // Bubble background with rounded corners
  ctx.fillStyle = COLORS.bubbleBg;
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 6);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = COLORS.bubbleBorder;
  ctx.lineWidth = 1;
  roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 6);
  ctx.stroke();

  // Bubble tail (small triangle)
  ctx.fillStyle = COLORS.bubbleBg;
  ctx.beginPath();
  ctx.moveTo(x - 4, bubbleY + bubbleHeight);
  ctx.lineTo(x + 4, bubbleY + bubbleHeight);
  ctx.lineTo(x, bubbleY + bubbleHeight + 6);
  ctx.closePath();
  ctx.fill();

  // Text (multiple lines)
  ctx.fillStyle = COLORS.bubbleText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const startY = bubbleY + paddingY + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight);
  }

  ctx.textBaseline = 'alphabetic';
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Main render function
export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: WorldState,
  deltaMs: number = 16
): void {
  const { worldSize, users, me } = world;

  // Clear and fill background
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, worldSize.w, worldSize.h);

  // Draw tilemap floor layers (or grid fallback)
  if (tilemapRenderer?.isReady()) {
    tilemapRenderer.drawFloorLayers(ctx);
  } else {
    drawGrid(ctx, worldSize);
  }

  // Sort users: by Y position for depth, then player on top
  const sortedUsers = Object.values(users).sort((a, b) => {
    if (a.userId === me) return 1;
    if (b.userId === me) return -1;
    return a.renderPos.y - b.renderPos.y;
  });

  // Draw all characters
  for (const user of sortedUsers) {
    drawCharacter(ctx, user, user.userId === me, deltaMs);
  }

  // Draw tilemap overlay layers (above characters)
  if (tilemapRenderer?.isReady()) {
    tilemapRenderer.drawOverlayLayers(ctx);
  }

  // Draw all bubbles (on top of everything)
  for (const user of sortedUsers) {
    drawBubble(ctx, user);
  }
}
