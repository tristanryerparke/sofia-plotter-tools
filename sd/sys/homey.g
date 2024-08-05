

M564 S0 H0                  ; Free axes

M584 X0.2 Y0.0 U0.1 Z121.0 A122.0 P5 ; Map axes to seperate Y and U

G91                         ; Relative movement mode
G53 G1 Y1500 U1500 H1 F4000     ; Move to endstop
G53 G1 Y-5 U-5                  ; Back off
G53 G1 Y6 U6 H1 F250            ; Move to endstop slowly
G90                         ; Absolute movement mode

M584 X0.2 Y0.0:0.1 Z121.0 A122.0 P4 ; Combine U axis into Y

G92 Y0                      ; Set Y position to 0
M564 S1 H1                  ; Restrict axes