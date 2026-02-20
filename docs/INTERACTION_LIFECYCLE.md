# Interaction / Registration Lifecycle

*A registration and an interaction are the same entity.*

## Short description

A registration starts when a patient is scheduled. Once a doctor starts it, the visit becomes ongoing. From there:

- **Save draft** → Moves to **Incomplete** (partial info saved, resume later)
- **Cancel** → Returns to **Scheduled** (no draft saved, start from scratch next time)
- **Complete** → CC, S, O saved (then closed when billing info added → unbilled → billed)

There is no separate "draft" flag—**incomplete** is the draft state (partial data preserved).

## Flags table

| Flag | Type | Default | Description | When set |
|------|------|---------|-------------|----------|
| `started` | Boolean | false | Visit has been started by doctor | When doctor clicks "Start" |
| `ongoing` | Boolean | false | Currently in progress | When doctor starts |
| `completed` | Boolean | false | CC, S, O filled and saved | When doctor saves interaction |
| `incomplete` | Boolean | false | Draft saved (partial info), resume later | When doctor saves draft / moves to incomplete |
| `closed` | Boolean | false | Billing info added, ready for billing | Auto when completed + service lines have (totalFee > 0 or accountingNumber) |
| `billed` | Boolean | false | Sent to billing system | When marked as billed |
| `billedAt` | String | '' | Billing timestamp | When billed=true |

## Lifecycle flow

```
Created → Scheduled → Started (ongoing) ──┬── → Save draft → Incomplete (resume later)
             ↑                            │
       Back to Scheduled     ←   Cancel ──├
      (start from scratch)                │
                                          └── → Complete (CC,S,O) → Closed (billing info added) 
                                                                        ↓
                                                                    Unbilled → Billed
```

## Derived states

- **Scheduled:** `!completed && !ongoing && !incomplete` — waiting to be started
- **Incomplete:** `incomplete && !completed` — draft saved, can resume
- **Unbilled:** `completed && closed && !billed` — ready for billing
- **Billed:** `billed === true`
