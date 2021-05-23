# TODO
- platforms
    - render something?
- routes model
    - platforms, tracks, trains?
- trains
    - blocked/need routes first
    - sync periodically with server postion, velocity, route, platform?, loading?
- actions
    - send down available actions 
    - cache actions on client?
    - implement actions server side
- register client?
- better common data structure
    - rework GraphObj creation methods to work with connections (AKA nodes) instead of tracksections (AKA edges). The current .extend and .fork methods are a bit awkward.
    - cache ranges inside fully reinflated graph?
- more complex graphics?
- persistent state on the server?
- users/perms?
