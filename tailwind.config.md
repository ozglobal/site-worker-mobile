
Usage:

primary-active / success = #0061A3
primary-default           = #045799
secondary-active          = #1FB6A6
secondary-default         = #33D4C1

Primary Button
| State    | Style                         |
| -------- | ----------------------------- |
| Default  | `bg-primary text-white`       |
| Hover    | `bg-primary-active`           |
| Active   | `bg-primary-active`           |
| Disabled | `bg-primary/40 text-white/60` |
<Button className="bg-primary hover:bg-primary-active">
  Submit
</Button>

Secondary Button
| State          | Style                           |
| -------------- | ------------------------------- |
| Default        | `bg-secondary text-white`       |
| Hover / Active | `bg-secondary-active`           |
| Disabled       | `bg-secondary/40 text-white/60` |

Ghost / Outline Button
text-primary-active
border-primary-active
hover:bg-primary-active/10

Toast (Success = Primary)
Success Toast (완료 피드백)
| Element    | Style                      |
| ---------- | -------------------------- |
| Icon       | `text-primary-active`      |
| Title      | `text-primary-active`      |
| Background | `bg-primary-active/10`     |
| Border     | `border-primary-active/30` |
<div className="border border-primary-active/30 bg-primary-active/10">
  ✔ Saved successfully
</div>

3️⃣ Alert (Inline Feedback)
Success Alert
bg-primary-active/8
text-primary-active
border-l-4 border-primary-active

⚠️ Tip
Success Alert에서는 solid 배경 금지
→ 액션 UI와 혼동 방지

4️⃣ Badge / Chip
Success Badge
Type	Style
Solid	bg-primary-active text-white
Subtle (추천)	bg-primary-active/15 text-primary-active
<Badge className="bg-primary-active/15 text-primary-active">
  Completed
</Badge>

5️⃣ BottomNav / Tab (Mobile 중요)
Selected 상태
icon: text-primary-active (filled)
label: text-primary-active
indicator: bg-primary-active

Unselected
icon: text-muted-foreground
label: text-muted-foreground


👉 Success 색을 Nav에 쓰지 않는 이유

Success = 결과

Nav = 위치

하지만 Primary와 공유하므로 시각적으로는 자연스럽게 연결

6️⃣ Form Feedback (Field Level)
Success Hint
text-primary-active
icon-check-circle
