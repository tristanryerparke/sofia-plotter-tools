M453

; Drive mapping
M584 X0.2 Y0.0:0.1 Z121.0 A122.0 P4 S0 R0
M584 U0.1 P4 S0 R0


; Individual drive params
M569 P0.2 D3
M569 P0.0 D3 S0
M569 P0.1 D3
M569 P121.0 D3
M569 P122.0 D3 S0

; Endstops
M574 X1 P"0.io1.in" S1
M574 Y2 P"0.io2.in" S1
M574 U2 P"0.io3.in" S1
M574 Z2 P"121.io0.in" S1
M574 A2 P"122.io0.in" S1

; Soft Limits
M208 X0:1222.4
M208 Y-1500:0
M208 U-1500:0
M208 Z-104.5:0
M208 A-104.5:0

; Max feedrates
M203 X27000 Y27000  U27000  Z27000  A27000
; Max acceleration
M201 X1000   Y1000  Y1000   Z1000   A1000



; Steps per MM
M92 Y53.33 U53.33 X53.33 Z53.33 A53.33 S16


; Current (mah)
M906 X1500 Y1500 U1500 Z1000 A1000 I100

; Standstill current
M917 X50 Y50 U50 Z75 A75

; Segmentation
M669 S10 T0.1


; Free axes
;M564 S0 H0

; 
M501


