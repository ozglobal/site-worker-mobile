# Design Tokens

Quick reference for color, typography, and component usage patterns. Full token definitions live in [`tailwind.config.cjs`](../tailwind.config.cjs).

Base font: **Pretendard** (Korean-optimized).

## Colors

### Brand tokens

| Token | Hex | Role |
|---|---|---|
| `primary` / `primary-default` | `#045799` | Primary brand |
| `primary-active` | `#0061A3` | Primary hover/active **and** success |
| `secondary` / `secondary-default` | `#33D4C1` | Secondary brand |
| `secondary-active` | `#1FB6A6` | Secondary hover/active |

> **Note:** `success` semantics share the `primary-active` token — no separate green.

## Typography

### Font size

| Class | rem | px |
|---|---|---|
| `text-xs` | 0.75rem | 12px |
| `text-sm` | 0.875rem | 14px |
| `text-base` | 1rem | 16px |
| `text-lg` | 1.125rem | 18px |
| `text-xl` | 1.25rem | 20px |
| `text-2xl` | 1.5rem | 24px |
| `text-3xl` | 1.875rem | 30px |
| `text-4xl` | 2.25rem | 36px |

### Font weight

| Class | Weight | Description |
|---|---|---|
| `font-thin` | 100 | Thin |
| `font-extralight` | 200 | Extra Light |
| `font-light` | 300 | Light |
| `font-normal` | 400 | Normal (default) |
| `font-medium` | 500 | Medium |
| `font-semibold` | 600 | Semi Bold |
| `font-bold` | 700 | Bold |
| `font-extrabold` | 800 | Extra Bold |
| `font-black` | 900 | Black |

## Component patterns

### Buttons — Primary

| State | Classes |
|---|---|
| Default | `bg-primary text-white` |
| Hover | `bg-primary-active` |
| Active | `bg-primary-active` |
| Disabled | `bg-primary/40 text-white/60` |

```tsx
<Button className="bg-primary hover:bg-primary-active">Submit</Button>
```

### Buttons — Secondary

| State | Classes |
|---|---|
| Default | `bg-secondary text-white` |
| Hover / Active | `bg-secondary-active` |
| Disabled | `bg-secondary/40 text-white/60` |

### Buttons — Ghost / Outline

```
text-primary-active
border-primary-active
hover:bg-primary-active/10
```

### Toast — Success (= Primary)

| Element | Classes |
|---|---|
| Icon | `text-primary-active` |
| Title | `text-primary-active` |
| Background | `bg-primary-active/10` |
| Border | `border-primary-active/30` |

```tsx
<div className="border border-primary-active/30 bg-primary-active/10">
  ✔ Saved successfully
</div>
```

### Inline Alert — Success

```
bg-primary-active/8
text-primary-active
border-l-4 border-primary-active
```

> **Tip:** Never use a solid background for success alerts — it gets confused with action UI.

### Badge / Chip

| Type | Classes |
|---|---|
| Solid | `bg-primary-active text-white` |
| Subtle (preferred) | `bg-primary-active/15 text-primary-active` |

```tsx
<Badge className="bg-primary-active/15 text-primary-active">Completed</Badge>
```

### BottomNav / Tab (mobile)

| State | Classes |
|---|---|
| Selected — icon | `text-primary-active` (filled) |
| Selected — label | `text-primary-active` |
| Selected — indicator | `bg-primary-active` |
| Unselected — icon | `text-muted-foreground` |
| Unselected — label | `text-muted-foreground` |

> Why share with success? Success = result, Nav = location — different meanings, but reusing the primary family keeps the visual language coherent.

### Form field — success hint

```
text-primary-active
icon: check-circle
```
