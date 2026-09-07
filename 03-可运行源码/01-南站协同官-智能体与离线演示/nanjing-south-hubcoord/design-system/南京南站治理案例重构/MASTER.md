# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** 南京南站治理案例重构
**Generated:** 2026-09-06 20:33:19；按案例语义与既有品牌材料校准
**Category:** Government/Public Service

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#071926` | `--blue-2` |
| Secondary | `#142F49` | `--blue` |
| CTA/Accent | `#F28C45` | `--signal` |
| Information | `#8FD7FF` | `--electric` |
| Background | `#F3EFE6` | `--paper` |
| Text | `#11100E` | `--ink` |

**Color Notes:** 南京南站夜色蓝作为系统背景，轨道信号橙用于行动和选择，冷青只标示数据与网络关系。

### Typography

- **Heading Font:** Songti SC / Source Han Serif SC
- **Body Font:** PingFang SC / Noto Sans CJK SC
- **Mood:** magazine, editorial, publishing, refined, journalism, print
- **Loading:** 使用本机中文字体栈，不请求外部字体，避免 CSP、性能与中文缺字问题。
- **Chinese wrapping:** 普通标题使用 `text-wrap: balance`；封面主标题和章节命题使用显式行盒并保持 `white-space: nowrap`，字号随视口收缩，不允许末行只剩 1–2 个汉字。

**CSS Import:**
```css
:root {
  --serif: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
  --sans: "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
}
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Brand mark

- 橙色轮廓取自车站拱顶，三条横线同时指向站台与治理接口；中心白点表示政企协同节点。
- 标志只使用本地 SVG，不再使用单字方块作为替代；深色与浅色界面共用同一文件。
- 顶部导航显示“南雍治道”，进入智能体内容后用页面标题呈现“南站协同官”，避免团队名与产品名混为一层。

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #F28C45;
  color: #11100E;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #11100E;
  border: 1px solid #11100E;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FFFDF8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #142F49;
  outline: none;
  box-shadow: 0 0 0 3px #8FD7FF66;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Accessible & Ethical

**Keywords:** High contrast, large text (16px+), keyboard navigation, screen reader friendly, WCAG compliant, focus state, semantic

**Best For:** Government, healthcare, education, inclusive products, large audience, legal compliance, public

**Key Effects:** Clear focus rings (3-4px), ARIA labels, skip links, responsive design, reduced motion, 44x44px touch targets

### Page Pattern

**Pattern Name:** Editorial Chaptered Case

- 封面只保留“案例故事”“案例分析”两个主入口，并在右侧索引协同实验。
- 故事与分析各自使用可折叠章节侧栏；900px 以下切换为抽屉，不占正文宽度。
- 深层智能体页面使用同一品牌标志与六项导航，维持从问题、机制到操作和证据的连续路径。
- 深色章节承载冲突与边界，纸张色章节承载证据与分析；每个区段只保留一个主动作。

---

## Anti-Patterns (Do NOT Use)

- ❌ Ornate design
- ❌ Low contrast
- ❌ 无法暂停、抢夺阅读注意力或未提供 reduced-motion 降级的动效
- ❌ AI purple/pink gradients

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
