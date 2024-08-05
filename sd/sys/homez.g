

M564 S0 H0                  ; Free axes

G91                         ; Relative movement mode
G53 G1 Z200 H1 F4000          ; Move to endstop
G53 G1 Z-5                      ; Back off
G53 G1 Z6 H1 F250              ; Move to endstop slowly  
G90                         ; Absolute movement mode

G92 Z0                      ; Set X position to 0
M564 S1 H1                  ; Restrict axes