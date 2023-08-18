# Boneyard Collection
- [Boneyard Drawing Tools](https://github.com/operation404/boneyard-drawing-tools)
- [Boneyard Template Tools](https://github.com/operation404/boneyard-template-tools)
- [Boneyard Turn Timer](https://github.com/operation404/boneyard-turn-timer)
- [Boneyard Socketlib Companion](https://github.com/operation404/boneyard-socketlib-companion)

# Boneyard Drawing Tools
- [Simple and easy to use turn timer](#simple-and-easy-to-use-turn-timer)

- [TODO](#todo)

## Simple and easy to use turn timer
A new timer bar is added to the combat tracker visible to all users that displays how much time is left for the current acting player to take their turn. Timers use a configurable default duration with options for per-user custom turn durations.

Timers are only attached when a token controlled by a player is acting. If a token is controlled by multiple players, the timer duration uses the longest of all players who control the token. If a token is only controlled by the GM, no timer is attached.

<img src="https://github.com/operation404/boneyard-turn-timer/blob/master/images/turn timer main example.png?raw=true" width=30%>

## Timer alerts
Various alerts can be configured to help players be prepared for their turn in combat. The timer can be configured to start to flash when a certain percentage of their time has run out. A warning sound can also be configured to play at this point, as well as a different sound played at the start of a player's turn. A whispered chat message and sound alert can also be configured to occur when a player's turn is coming up next.

<>

## Automatic turn passing
The timer can be configured to automatically continue to the next turn when the timer's duration has elapsed. This can also be disabled, allowing the timer to be used as a reminder for players to be mindful of how long their turn takes without forcing them to end their turn early if they happen to take a little more time than usual. If disabled the timer will still appear and give alerts as normal, but will stop updating and stay at 0 seconds left once the timer's duration has elapsed.

## Quick toggle timers on and off
GMs have a new control on the combat tracker to allow toggling timers on and off. When toggled off, timers are not attached when player turns occur in combat and no alerts are given.

<>

## Appearance customization

## Settings




## TODO
- [ ] Add more styles of timer bar. (more detailed CSS options? Radial timer?)
- [ ] Add popout timer bar / alert window.
- [ ] Add option for timers on GM turns. (If desired, I don't think this is particularly useful)

