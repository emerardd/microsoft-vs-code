# Gameplay direction

## Confirmed and implemented

- A short roguelike run: five enemy waves followed by one final boss. Approximately five minutes for a practiced player is a pacing target, not a hard time limit.
- One three-option choice before wave one and one after each of the first four waves. Menus and pauses do not consume simulation time.
- Shield prevents damage and consumes hostile bullets on contact; it deals no collision damage. Unshielded contact costs HP but preserves weapon levels.
- Ricochet stays capped at one level. A full ricochet build redesign is deferred.
- Meta progression emphasizes unlocks with capped permanent attributes. Five cumulative cleared waves unlock weapon-level-2 spread starts. First victory unlocks weapon-level-1 plus Piercing-level-1 starts. Every five cumulative waves grants +2 permanent HP, capped at +10. Choose one loadout; new bonuses apply next run.
- Ask the user before making further gameplay choices.

## Initial tuning and validation boundary

The existing enemy kill targets (15/20/25/30/35), spawn cadence and wave-based enemy stats are retained. Existing between-wave recovery and passive growth move from boss defeats to the first four wave clears. The final boss uses the existing wave-five boss parameters. This preserves a concrete baseline for playtesting, rather than claiming the five-minute target is already measured.

Automated fixtures may use accelerated clocks and high damage/health to check state transitions. Their completion times are not balance measurements. Human playtests should record clear time, first-run survival, chosen upgrades, damage sources and final-boss time before further tuning.

## Remaining design work

- Adjust target counts or combat stats after playtesting, with user agreement.
- More distinct role/weapon identities and additional upgrade pools can follow the initial three loadouts; this version does not claim to provide separate character abilities.
- Low-ammo incentives and a full ricochet build remain future gameplay decisions.

## Persistence

Wave clears credit progress immediately. A run ID prevents duplicate credit after restoring an older checkpoint. Browser and extension profiles are independent local profiles; extension progress survives closing the game panel through global storage. There is no cloud sync. Checkpoint v2 supports the finite campaign; v1 saves migrate with preserved history and player stats.
