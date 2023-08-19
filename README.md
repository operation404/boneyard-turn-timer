# Boneyard Collection
- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Drawing Tools
- [Simple and easy to use turn timer](#simple-and-easy-to-use-turn-timer)
- [Timer alerts](#timer-alerts)
- [Automatic turn passing](#automatic-turn-passing)
- [Quick toggle timers on and off](#quick-toggle-timers-on-and-off)
- [Appearance customization](#appearance-customization)
- [Settings](#settings)
- [TODO](#todo)

## Simple and easy to use turn timer
A new timer bar is added to the combat tracker visible to all users that displays how much time is left for the current acting player to take their turn. Timers use a configurable default duration with options for per-user custom turn durations. The timer bar shows how many seconds are left as a whole number, truncating any decimal portion before displaying.

Timers are only attached when a token controlled by a player is acting. If a token is controlled by multiple players, the timer duration uses the longest of all players who control the token. If a token is only controlled by the GM, no timer is attached.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/turn timer main example.png?raw=true" width=30%>

## Timer alerts
Various alerts can be configured to help players be prepared for their turn in combat. The timer can be configured to start to flash when a certain percentage of their time has run out. A warning sound can also be configured to play at this point, as well as a different sound played at the start of a player's turn. A whispered chat message and sound alert can also be configured to occur when a player's turn is coming up next.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/timer warnings.png?raw=true" width=60%>

## Automatic turn passing
The timer can be configured to automatically continue to the next turn when the timer's duration has elapsed. This can also be disabled, allowing the timer to simply function as a reminder without forcing a player to end their turn early if they happen to need a little extra time. The timer will still be visible and give alerts while turn passing is disabled, but will halt at 0 seconds left once the timer's duration has elapsed.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/turn pass disabled.png?raw=true" width=40%>

## Quick toggle timers on and off
GMs have a new combat tracker control with an hourglass icon that toggles timers on and off. When toggled off, timers are not attached when player turns occur in combat and no alerts are given. The hourglass icon has a blue glow when timers are enabled and no glow when timers are disabled.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/timer toggle button.png?raw=true" width=20%>

## Appearance customization
Both the timer bar and warning glow have configuration fields for changing their color.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/timer bar customization.png?raw=true" width=40%>

## Settings
All given settings are world-level and can only be changed by a GM.

The default timer duration is an integer number greater than 0, and is in seconds. If a non-integer input is given it will be truncated and an input less than 1 will become 1.

Whether or not to automatically pass a turn when the turn timer's duration has elapsed can be toggled on or off.

The warning threshold is what percentage of time remaining to trigger the warning alert. If set to 0.25 with a turn time of 60 seconds, a warning will be given at 15 seconds remaining. If set to 0, the warning is given as the turn timer finishes (and as the turn ends if automatic passing is enabled). If set to -0.05, no warning is given.

Whether or not to send players a whisper chat message when their turn is up next can be toggled on or off.

The colors of the timer bar and warning glow can be any hex color.

The sounds played at the turn start, warning threshold, and up next turn alerts are given as paths to a sound file. This module comes with a few basic free sounds used as alerts, but any path to a sound within Foundry's data folder can be used. Sounds are played at user's interface volume level setting.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/example settings.png?raw=true" width=50%>

## TODO
- [ ] Add options to color timer per user, as well as options to get the user's chosen color for use in their timer bar.
- [ ] Add better alert customization. Perhaps a sub menu that defines alerts per user, with the ability to define any number of alerts at any threshold, both message and sound?
- [ ] Add more styles of timer bar. (more detailed CSS options? Radial timer?)
- [ ] Add popout timer bar / alert window.
- [ ] Add option for timers on GM turns. (If desired, I don't think this is particularly useful)

