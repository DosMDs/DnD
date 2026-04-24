---
type: system_home
title: DND Home
aliases:
  - DND Home
  - DND Dashboard
tags:
  - dnd
  - system
created: 2026-04-21
updated: 2026-04-22
---

# `VIEW[{title}]`

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> ```meta-bind-button
> label: Создать кампанию
> icon: folder-plus
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Campaign.md"
> ```

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

`BUTTON[home-aliases-sync]`

```meta-bind-button
id: home-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
```

## Активные кампании

```dataview
TABLE WITHOUT ID
  link(file.path, title) as "Кампания",
  system as "Система",
  current_arc as "Текущая арка",
  last_session_date as "Последняя сессия"
FROM "02_Campaigns"
WHERE type = "campaign" AND status = "active"
SORT campaign_id ASC
```

## Приостановленные кампании

```dataview
TABLE WITHOUT ID
  link(file.path, title) as "Кампания",
  system as "Система",
  current_arc as "Текущая арка",
  last_session_date as "Последняя сессия"
FROM "02_Campaigns"
WHERE type = "campaign" AND status = "paused"
SORT campaign_id ASC
```

## Завершённые кампании

```dataview
TABLE WITHOUT ID
  link(file.path, title) as "Кампания",
  system as "Система",
  last_session_date as "Последняя сессия"
FROM "02_Campaigns"
WHERE type = "campaign" AND status = "completed"
SORT campaign_id ASC
```

## Архив

```dataview
TABLE WITHOUT ID
  link(file.path, title) as "Кампания",
  system as "Система",
  last_session_date as "Последняя сессия"
FROM "02_Campaigns"
WHERE type = "campaign" AND status = "archived"
SORT campaign_id ASC
```