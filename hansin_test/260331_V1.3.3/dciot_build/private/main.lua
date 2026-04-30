require "disp_process"
require "touch_process"
require "can_process"
require "user"
require "sd_card"


BIT0 = 0x01
BIT1 = 0x02
BIT2 = 0x04
BIT3 = 0x08
BIT4 = 0x10
BIT5 = 0x20
BIT6 = 0x40
BIT7 = 0x80


NBIT0 = 0xFE
NBIT1 = 0xFD
NBIT2 = 0xFB
NBIT3 = 0xF7
NBIT4 = 0xEF
NBIT5 = 0xDF
NBIT6 = 0xBF
NBIT7 = 0x7F


Rabbit = 0
Tuttle = 1

Current_mdoe = Rabbit
Current_screen = 0

local dhcp = " "
local ipaddr = " "
local netmask = " "
local gateway = " "
local dns = " "
local net_Str = " "


System_cnt = 0
Display_cnt = 0
Display_old_cnt = 0;
Test_cnt = 0
Tm_10cnt = 0
Tm_1 = 0


--- for time check



-- for ip network check


local sd_test_can = {1,2,3,4,5,6,7,8}
local ms_50_cnt = 0

local old_rcv_evnet_code = 0
Setup_enable = 0

local check_eep_str = " "

Flash_code_str = ""

File_name =  " "
Dir_name = " "

-- ============================================
-- 수평계 설정
-- ============================================
local SPIRIT_LEVEL_X    = 50
local SPIRIT_LEVEL_Y    = 50
local SPIRIT_LEVEL_SIZE = 525
local MAX_ANGLE         = 500
local CENTER_X          = SPIRIT_LEVEL_X + (SPIRIT_LEVEL_SIZE / 2)
local CENTER_Y          = SPIRIT_LEVEL_Y + (SPIRIT_LEVEL_SIZE / 2)
local MAX_RADIUS        = SPIRIT_LEVEL_SIZE / 2
local bubble_offset     = 55
local buggle_image_size = bubble_offset * 2

-- 수평계 Flash 저장 주소 (기존 Flash_code_str(0x0000)과 겹치지 않게 0x0100 이후 사용)
local FLASH_ADDR_ROTATE   = 0x0100
local FLASH_ADDR_X_OFFSET = 0x0110
local FLASH_ADDR_Y_OFFSET = 0x0120
local FLASH_ADDR_VALID    = 0x0130

Rotate   = 0
X_offset = 0
Y_offset = 0

Level_angle_warn = 0
Level_get_x = 0
Level_get_y = 0
Old_sol_state = 0

local function write_uint32(addr, value)
    local bytes = {}
    bytes[0] = (value >> 24) & 0xFF
    bytes[1] = (value >> 16) & 0xFF
    bytes[2] = (value >> 8)  & 0xFF
    bytes[3] = (value >> 0)  & 0xFF
    write_flash(addr, bytes)
end

local function read_uint32(addr)
    local bytes = read_flash(addr, 4)
    local value = 0
    value = value | ((bytes[0] << 24) & 0xFFFFFFFF)
    value = value | ((bytes[1] << 16) & 0xFFFFFFFF)
    value = value | ((bytes[2] << 8)  & 0xFFFFFFFF)
    value = value | ((bytes[3] << 0)  & 0xFFFFFFFF)
    return value
end

local function write_int64(addr, value)
    local bytes = {}
    bytes[0] = (value >> 56) & 0xFF
    bytes[1] = (value >> 48) & 0xFF
    bytes[2] = (value >> 40) & 0xFF
    bytes[3] = (value >> 32) & 0xFF
    bytes[4] = (value >> 24) & 0xFF
    bytes[5] = (value >> 16) & 0xFF
    bytes[6] = (value >> 8)  & 0xFF
    bytes[7] = (value >> 0)  & 0xFF
    write_flash(addr, bytes)
end

local function read_int64(addr)
    local bytes = read_flash(addr, 8)
    local value = 0
    value = value | ((bytes[0] << 56) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[1] << 48) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[2] << 40) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[3] << 32) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[4] << 24) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[5] << 16) & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[6] << 8)  & 0xFFFFFFFFFFFFFFFF)
    value = value | ((bytes[7] << 0)  & 0xFFFFFFFFFFFFFFFF)
    if ((value & 0xFFFFFFFFFFFFFFFF) & 0x8000000000000000) ~= 0 then
        value = (0x8000000000000000 - (value & 0x7FFFFFFFFFFFFFFF)) * -1
    end
    return value
end

function save_sensor_config()
    write_uint32(FLASH_ADDR_ROTATE,   Rotate)
    write_int64 (FLASH_ADDR_X_OFFSET, X_offset)
    write_int64 (FLASH_ADDR_Y_OFFSET, Y_offset)
    write_uint32(FLASH_ADDR_VALID,    0xAA55AA55)
    flush_flash()
end

function load_sensor_config()
    local valid = read_uint32(FLASH_ADDR_VALID)
    if valid == 0xAA55AA55 then
        Rotate   = read_uint32(FLASH_ADDR_ROTATE)
        X_offset = read_int64 (FLASH_ADDR_X_OFFSET)
        Y_offset = read_int64 (FLASH_ADDR_Y_OFFSET)
    else
        Rotate   = 0
        X_offset = 0
        Y_offset = 0
    end
end

function AngleToCoordinate(angleX, angleY)
    if angleX >  MAX_ANGLE then angleX =  MAX_ANGLE end
    if angleX < -MAX_ANGLE then angleX = -MAX_ANGLE end
    if angleY >  MAX_ANGLE then angleY =  MAX_ANGLE end
    if angleY < -MAX_ANGLE then angleY = -MAX_ANGLE end

    if angleX == 0 and angleY == 0 then
        return math.floor(CENTER_X + 0.5), math.floor(CENTER_Y + 0.5)
    end

    local normX = angleX / MAX_ANGLE
    local normY = angleY / MAX_ANGLE
    local maxNorm = math.max(math.abs(normX), math.abs(normY))
    local scale   = maxNorm / math.sqrt(normX*normX + normY*normY)

    local x = CENTER_X + (normX * scale * MAX_RADIUS)
    local y = CENTER_Y - (normY * scale * MAX_RADIUS)
    return math.floor(x + 0.5), math.floor(y + 0.5)
end


Ms_5_cnt = 0

Get_ms = 0
function on_init()
	local temp_str = ""

	load_sensor_config()
	Old_sol_state = Rcv_sol_state
	if Rcv_sol_state == 1 then change_screen(16) end

    if USB_check == 1 then  File_creation()  end
	Year,Mon,Day,Hour,Min,Sec,Week = get_date_time()
	Tx_can_mode_and_rmt[4] = Current_mdoe
--	start_timer(0, 50, 0, 0)

	-- msg not use
	set_enable(0,201,0)
	set_visiable(0,202,0)
	set_text(0,200,temp_str)	

	set_enable(1,201,0)
	set_visiable(1,202,0)
	set_text(1,200,temp_str)	

	set_enable(2,201,0)
	set_visiable(2,202,0)
	set_text(2,200,temp_str)	

	canbus_open(0,125,0,0)
	start_timer(1, 5, 0, 0)
	start_timer(0, 200, 0, 0)

	Can_send_min_max[0] = 0

	Flash_code_str = read_flash_string(0)
	--set_text(0,73,Flash_code_str)	
	Folder_del() 
	
end




System_tic = 0

Can_out_send_flag = 0
Can_lamp_send_flag = 0
Can_send_cnt = 0
Get_tic = 0
Timer1_cnt = 0
function on_timer(timer_id)
	local temp_str = ""
	if timer_id == 0 then 
		--Data_logging()
		Timer1_cnt = Timer1_cnt+1
		Get_tic = Timer1_cnt%5
		if USB_check == 1 then Data_logging(Get_tic+1) end
	end
	
	if timer_id == 1  then
		System_tic = System_tic+1
		Ms_5_cnt = Ms_5_cnt+1

		if Old_sol_state ~= Rcv_sol_state then
			Old_sol_state = Rcv_sol_state
			if Rcv_sol_state == 1 then change_screen(16) end
			if Rcv_sol_state == 0 then change_screen(0) end
		end
		if Weight_send_zero_need_flag > 0 then
		canbus_write(0,0x647,8,0,0,Tx_can_mode_and_rmt)
		Weight_send_zero_need_flag = Weight_send_zero_need_flag-1
		end

		if Ms_5_cnt == 10 then
			if  Current_screen == 0 then Monitor_screen_process()  Msg_process() --- 스크린 프로세스
				elseif Current_screen == 1 then Diago1_process() Msg_process()
				elseif Current_screen == 2 then Diago4_process() Msg_process()
				elseif Current_screen == 3 then Rmt_axis_process()
				elseif Current_screen == 5 then Out_rabbit_disp_process()
				elseif Current_screen == 6 then Lamp_rabbit_disp_process()
				elseif Current_screen == 7 then Out_tuttle_disp_process()
				elseif Current_screen == 8 then Lamp_tuttle_disp_process()	
				elseif Current_screen == 9 then Angle_disp_process()	
				elseif Current_screen == 10 then Otg_disp_process()	
				elseif Current_screen == 11 then Weight_disp_process()	
				elseif Current_screen == 12 then Tilt_disp_process()
				elseif Current_screen == 16 then Angle_main_disp_process()
			end
		
		--if Ms_5_cnt == 4 and Current_screen == 0 then Msg_process()  end

		--elseif Ms_5_cnt == 13 and Rmt_axis_set_flag == 1 then canbus_write(0,0x647,6,0,0,Tx_can_mode_and_rmt) 
	--	elseif Ms_5_cnt == 7  then canbus_write(0,0x64,5,0,0,Rcv_alarm_msg) 
--		elseif Ms_5_cnt == 8  then canbus_write(0,0x65,2,0,0,Test_my) 	
	--	elseif Ms_5_cnt == 9  then canbus_write(0,0x67,5,0,0,Rcv_alarm_msg_old) 	
			
		elseif Ms_5_cnt == 14 and  Can_lamp_send_flag == 1 then Can_send_cnt = Can_send_cnt+1  Can_lamp_send()
		elseif Ms_5_cnt == 14 and Can_out_send_flag == 1 then 	Can_send_cnt = Can_send_cnt+1  Can_out_send()
		
		elseif Ms_5_cnt == 20 then Ms_5_cnt = 0 end
	
		

		if Rabbit_out_save_flag  == 1 and Rabbit_out_send_flag == 1 then  Can_out_send_flag = 1
		elseif Tuttle_out_save_flag  == 1 and Tuttle_out_send_flag == 1 then Can_out_send_flag = 1
		
		elseif Rabbit_lamp_save_flag  == 1 and Rabbit_lamp_send_flag == 1 then Can_lamp_send_flag = 1 
		elseif Tuttle_lamp_save_flag  == 1 and Tuttle_lamp_send_flag == 1 then Can_lamp_send_flag = 1 
		elseif Weight_set_flag == 2 then Can_weight_send() end	
	
	end
end




function on_sd_inserted(dir)	
	
end

function on_sd_removed()	


end



function on_systick() 

end

function on_draw(screen)
	if screen == 16 then
		draw_image(69, 0, SPIRIT_LEVEL_X, SPIRIT_LEVEL_Y, SPIRIT_LEVEL_SIZE, SPIRIT_LEVEL_SIZE, 0, 0)
		draw_image(70, Level_angle_warn, Level_get_x - bubble_offset, Level_get_y - bubble_offset, buggle_image_size, buggle_image_size, 0, 0)
	end
end

function on_screen_change(screen)
	Current_screen  = screen
	
	if Current_screen == 3 then Rmt_axis_init_process() set_visiable(Current_screen,28,0) set_enable(Current_screen,79,0)	
	elseif Current_screen == 4 then set_visiable(Current_screen,34,0) Help_show = 0
	elseif Current_screen == 5 then Out_rabbit_init_process() 	canbus_write(0,0x647,5,0,0,Tx_can_mode_and_rmt) 
	elseif Current_screen == 7 then Out_tuttle_init_process() 	canbus_write(0,0x647,5,0,0,Tx_can_mode_and_rmt) 	
	elseif Current_screen == 6 then Lamp_rabbit_init_process() 	canbus_write(0,0x647,5,0,0,Tx_can_mode_and_rmt) 
	elseif Current_screen == 8 then Lamp_tuttle_init_process() 	canbus_write(0,0x647,5,0,0,Tx_can_mode_and_rmt) 	
	elseif Current_screen == 9 then set_visiable(Current_screen,35,0) Help_show = 0 set_visiable(Current_screen,78,0)  set_enable(Current_screen,79,0)	
	elseif Current_screen == 10 then set_visiable(Current_screen,35,0) Help_show = 0 set_visiable(Current_screen,93,0) set_enable(Current_screen,85,0)	
	elseif Current_screen == 11 then Weight_init_disp()
	elseif Current_screen == 12 then set_visiable(Current_screen,58,0) Help_show = 0
	elseif Current_screen == 13 then set_visiable(Current_screen,3,1) set_enable(Current_screen,3,1)
	elseif Current_screen == 14 then Manage_pw_disp_init()
	elseif Current_screen == 15 then set_visiable(Current_screen,58,0) Help_show = 0
	elseif Current_screen == 16 then redraw()
	end


end

USB_check = 0
function on_usb_inserted(driver)


	USB_check = 1

end