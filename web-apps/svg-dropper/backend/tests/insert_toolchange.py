# read_gcode.py
def insert_tool_commands(file_path, N):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    tool_counter = 0
    tool_command = 'T1'

    for i, line in enumerate(lines):
        if line.startswith('G1 Z') and '20.00' in line:
            tool_counter += 1
            if tool_counter % N == 0:
                # lines.insert(i + 1, tool_command + '\n' + 'M98 P"/macros/dip_in_paint.g"\n')
                lines.insert(i + 1, tool_command + '\n')
                tool_command = 'T2' if tool_command == 'T1' else 'T1'
                

    with open(file_path, 'w') as file:
        file.writelines(lines)

# Usage
insert_tool_commands('/Users/tristanryerparke/Downloads/maya_vg_two_brush_raw.gcode', 5)