require "user"
require "disp_process"

local RED = 0xF800
local BLUE = 0x001f
local GREEN = 0x07e0
local DARK_WHITE = 0xFFDF
local PASTEL_YELLOW = 0XFFD4

local test_touch = 0
local tch_str = " "

User_setup_en = 0
Manage_setup_en = 0

Rabbit_out_change_flag = 0
Tuttle_out_change_flag = 0
Rabbit_lamp_change_flag = 0
Tuttle_lamp_change_flag = 0

Rabbit_out_save_flag = 0
Tuttle_out_save_flag = 0
Rabbit_lamp_save_flag = 0
Tuttle_lamp_save_flag = 0

Rabbit_out_send_flag = 0
Tuttle_out_send_flag = 0
Rabbit_lamp_send_flag = 0
Tuttle_lamp_send_flag = 0

Weight_set_flag = 0
Rmt_axis_set_flag = 0


Tx_can_mode_and_rmt = {0,0,0,0,0,0,0}
Tx_can_rmt_dir = {0,0,0,0, 0,0,0,0}
Tx_can_rmt_para = {0,0,0,0, 0,0,0,0}
Tx_can_car_para = {0,0,0,0, 0,0,0,0}
Can_send_min_max = {0,0,0,0, 0,0,0,0}


Can_send_deric_out = {0,0,0,0,0,0,0,0} -- 1602
Can_send_boom1_out = {0,0,0,0,0,0,0,0} -- 1603
Can_send_boom2_out = {0,0,0,0,0,0,0,0} -- 1611
Can_send_seat_out = {0,0,0,0,0,0,0,0}  -- 1605
Can_send_rotate_out = {0,0,0,0,0,0,0,0}  --1604 

Can_send_deric_b1_lamp = {0,0,0,0,0,0,0,0}  --1606 
Can_send_rotate_seat_lamp = {0,0,0,0,0,0,0,0}  --1608
Can_send_b2_lamp = {0,0,0,0,0,0,0,0}  --1612

Min_max_set_touch_cnt = 0

function Msg_touch(scr, ctr)
	local temp_str = ""
	if ctr == 201 and Alam_cnt ~= 0 then
			
		if Msg_box_visible == 0 and Alam_cnt>1 then  
			Msg_box_visible = 1
			set_text(scr,200,Msg_str)
			set_enable(scr,201,1)

		else 
			Msg_box_visible = 0 
			temp_str = string.format("%d개의 알람이 있습니다", Alam_cnt)
			set_text(scr,200,temp_str)
					
		end

		 set_visiable(scr,202,Msg_box_visible)
	end	

end

function Get_string_data(arry_data, id, arry_index)
	local get_str = " "
	get_str = get_text(Current_screen, id)
	arry_data[arry_index] = tonumber(get_str)
end

function Input_range_judge(id, min, max)
	local str = " "
	local temp_i = 0

	str = get_text(Current_screen, id)
	temp_i = tonumber(str)
	if temp_i>max then temp_i = max end
	if temp_i<min then temp_i = min end
	str = string.format("%d", temp_i)
	set_text(Current_screen,id,str)
end

Msg_box_visible = 0
function monitor_touch_process(scr,ctr)

	if scr == 0 then
		if ctr== 55 and User_setup_en == 1 then change_screen(5) end
		if ctr== 55 and User_setup_en == 0 then change_screen(13) end
		if ctr== 56 and Manage_setup_en == 1 then change_screen(3) end
		if ctr== 56 and Manage_setup_en == 0 then change_screen(14) end
		if ctr== 35 then change_screen(16) end
		Msg_touch(scr, ctr)

	end
end

function diago1_touch_process(scr,ctr)
	if scr == 1 then
		if ctr== 59 and User_setup_en == 1 then change_screen(5) end
		if ctr== 59 and User_setup_en == 0 then change_screen(13) end
		if ctr== 60 and Manage_setup_en == 1 then change_screen(3) end
		if ctr== 60 and Manage_setup_en == 0 then change_screen(14) end
		Msg_touch(scr, ctr)
	end
end

function diago4_touch_process(scr,ctr)
	if scr == 2 then
		if ctr== 60 and User_setup_en == 1 then change_screen(5) end
		if ctr== 60 and User_setup_en == 0 then change_screen(13) end
		if ctr== 61 and Manage_setup_en == 1 then change_screen(3) end
		if ctr== 61 and Manage_setup_en == 0 then change_screen(14) end
		Msg_touch(scr, ctr)
	end
end




function Rmt_axis_touch_process(scr, ctr)
	local get_str = ""
	local sum_result = 0
	local duplication_check = 0

	if scr == 3 then
		if ctr == 79 then
		set_visiable(Current_screen,28,0) set_enable(Current_screen,79,0)
		end

		if ctr== 59 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 59 and Manage_setup_en == 0 then change_screen(14) end
		
		if ctr == 35 then 
			if Help_show == 1 then set_visiable(Current_screen,34,0) Help_show = 0 
			else  set_visiable(Current_screen,34,1) Help_show = 1 end
			
		end		
		
		if ctr == 32 then
			get_str = get_text(Current_screen, 19)
			Tx_can_mode_and_rmt[0] =  tonumber(get_str)
			get_str = get_text(Current_screen, 13)
			Tx_can_mode_and_rmt[1] =  tonumber(get_str)
			get_str = get_text(Current_screen, 16)
			Tx_can_mode_and_rmt[2] =  tonumber(get_str)
			get_str = get_text(Current_screen, 21)
			Tx_can_mode_and_rmt[3] =  tonumber(get_str)
			sum_result = Tx_can_mode_and_rmt[0] +Tx_can_mode_and_rmt[1] +Tx_can_mode_and_rmt[2]+Tx_can_mode_and_rmt[3]
			if  sum_result == 10 then
				if Tx_can_mode_and_rmt[0] == Tx_can_mode_and_rmt[1] or Tx_can_mode_and_rmt[0] == Tx_can_mode_and_rmt[2] or Tx_can_mode_and_rmt[0] == Tx_can_mode_and_rmt[3] then duplication_check = 1 end
				if Tx_can_mode_and_rmt[1] == Tx_can_mode_and_rmt[2] or Tx_can_mode_and_rmt[1] == Tx_can_mode_and_rmt[3]  then duplication_check = 1 end
				if Tx_can_mode_and_rmt[2] == Tx_can_mode_and_rmt[3]  then duplication_check = 1 end
				
				if duplication_check == 0 then
				--set_text(Current_screen,28, "Save parameter")
				Tx_can_mode_and_rmt[5] = 1
				canbus_write(0,0x647,7,0,0,Tx_can_mode_and_rmt) 
				Tx_can_mode_and_rmt[5] = 0
				--set_visiable(Current_screen,28,1)
				Rmt_axis_set_flag = 1
				end
			end	
			if sum_result ~= 10 or duplication_check == 1 then
				set_text(Current_screen,28, "Wrong parameter")
				set_visiable(Current_screen,28,1)
				set_enable(Current_screen,79,1)
		
			end

		end

	end

end
Rmt_joy_key = {true,true,true,true,true,true}

function Rmt_dir_touch_process(scr, ctr, val) --- joy axis
	if scr == 4 then
		local get_str = ""


		if ctr== 16 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 16 and Manage_setup_en == 0 then change_screen(14) end
		if ctr == 7 then 
			if Help_show == 1 then set_visiable(Current_screen,34,0) Help_show = 0 
			else  set_visiable(Current_screen,34,1) Help_show = 1 end
			
		end		

	
			if ctr == 19 then 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] & 0xc0 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] | BIT0
				canbus_write(0,1601,8,0,0,Tx_can_rmt_dir)
		    end  

			if ctr == 10 then 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] & 0xc0 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] | BIT1
				canbus_write(0,1601,8,0,0,Tx_can_rmt_dir)
		    end  

			if ctr == 11 then 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] & 0xc0
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] | BIT2
				canbus_write(0,1601,8,0,0,Tx_can_rmt_dir)
		    end  

			if ctr == 12 then 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] & 0xc0 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] | BIT3
				canbus_write(0,1601,8,0,0,Tx_can_rmt_dir)
		    end  

			if ctr == 14 then 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] & 0xc0 
				Tx_can_rmt_dir[2] = Tx_can_rmt_dir[2] | BIT4
				canbus_write(0,1601,8,0,0,Tx_can_rmt_dir)
		    end  



	end

end



function Out_rabbit_touch_process(scr, ctr)

	if scr == 5 then

		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end
		if ctr == 20 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
		end
			

		if ctr == 23 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1

		elseif ctr == 19 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1 -- 데릭

		elseif ctr == 21 then   Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1

		elseif ctr == 24 then
			Rabbit_out_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1

		elseif ctr == 30 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4 -- 붐2
		elseif ctr == 31 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4
		elseif ctr == 33 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4
		elseif ctr == 34 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4

		elseif ctr == 42 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2 -- 회전
		elseif ctr == 43 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2
		elseif ctr == 55 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2
		elseif ctr == 56 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2

		elseif ctr == 64 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3 -- 탑승함회전
		elseif ctr == 65 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3
		elseif ctr == 67 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3
		elseif ctr == 68 then
			 Rabbit_out_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3

		elseif ctr == 74 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1 -- 붐1
		elseif ctr == 75 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1
		elseif ctr == 77 then
			Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1
		elseif ctr == 78 then
			Rabbit_out_change_flag = 1
		end

		--[[
		if ctr == 95 then
			
				Rabbit_out_change_flag = 1
				local temp_int = 0
				local temp_str = " "
				temp_int = CombineToSigned16_dec(OR_Rcv_deric_out_pos_stop[1], OR_Rcv_deric_out_pos_stop[2]) -- 데릭 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,23,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_deric_out_pos_start[1], OR_Rcv_deric_out_pos_start[2]) -- 데릭 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,19,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_deric_out_neg_start[1], OR_Rcv_deric_out_neg_start[2]) -- 데릭 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,21,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_deric_out_neg_stop[1], OR_Rcv_deric_out_neg_stop[2]) -- 데릭 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,24,temp_str)
		
				---- 붐2
				temp_int = CombineToSigned16_dec(OR_Rcv_boom2_out_pos_stop[1], OR_Rcv_boom2_out_pos_stop[2]) -- 붐2 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,30,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom2_out_pos_start[1], OR_Rcv_boom2_out_pos_start[2]) -- 붐2 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,31,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom2_out_neg_start[1], OR_Rcv_boom2_out_neg_start[2]) -- 붐2 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,33,temp_str)	
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom2_out_neg_stop[1], OR_Rcv_boom2_out_neg_stop[2]) -- 붐2 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,34,temp_str)
		
				---- 회전
				temp_int = CombineToSigned16_dec(OR_Rcv_rotate_out_pos_stop[1], OR_Rcv_rotate_out_pos_stop[2]) -- 회전 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,42,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_rotate_out_pos_start[1], OR_Rcv_rotate_out_pos_start[2]) -- 회전 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,43,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_rotate_out_neg_start[1], OR_Rcv_rotate_out_neg_start[2]) -- 회전 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,55,temp_str)	
		
				temp_int = CombineToSigned16_dec(OR_Rcv_rotate_out_neg_stop[1], OR_Rcv_rotate_out_neg_stop[2]) -- 회전 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,56,temp_str)
		
				---- 탑승함 회전
				temp_int = CombineToSigned16_dec(OR_Rcv_seat_out_pos_stop[1], OR_Rcv_seat_out_pos_stop[2]) -- 탑승함회전 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,64,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_seat_out_pos_start[1], OR_Rcv_seat_out_pos_start[2]) -- 탑승함회전 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,65,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_seat_out_neg_start[1], OR_Rcv_seat_out_neg_start[2]) --탑승함 회전 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,67,temp_str)	
		
				temp_int = CombineToSigned16_dec(OR_Rcv_seat_out_neg_stop[1], OR_Rcv_seat_out_neg_stop[2]) --탑승함 회전 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,68,temp_str)
		
		
				---- 붐1
				temp_int = CombineToSigned16_dec(OR_Rcv_boom1_out_pos_stop[1], OR_Rcv_boom1_out_pos_stop[2]) -- 붐2 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,74,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom1_out_pos_start[1], OR_Rcv_boom1_out_pos_start[2]) -- 붐2 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,75,temp_str)
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom1_out_neg_start[1], OR_Rcv_boom1_out_neg_start[2]) -- 붐2 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,77,temp_str)	
		
				temp_int = CombineToSigned16_dec(OR_Rcv_boom1_out_neg_stop[1], OR_Rcv_boom1_out_neg_stop[2]) -- 붐2 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,78,temp_str)
	
		end
			
	
		]]--	
		if ctr == 32 and Rabbit_out_change_flag == 1 then

			Rabbit_out_save_flag = 1
			--set_visiable(Current_screen,39,1)

			Get_string_data(Out_rabbit_tx_arry,23,2)
			Get_string_data(Out_rabbit_tx_arry,19,1)
			Get_string_data(Out_rabbit_tx_arry,21,3)
			Get_string_data(Out_rabbit_tx_arry,24,4)



			Get_string_data(Out_rabbit_tx_arry,30,6)
			Get_string_data(Out_rabbit_tx_arry,31,5)
			Get_string_data(Out_rabbit_tx_arry,33,7)
			Get_string_data(Out_rabbit_tx_arry,34,8)

			Get_string_data(Out_rabbit_tx_arry,42,10)
			Get_string_data(Out_rabbit_tx_arry,43,9)
			Get_string_data(Out_rabbit_tx_arry,55,11)
			Get_string_data(Out_rabbit_tx_arry,56,12)

			Get_string_data(Out_rabbit_tx_arry,64,14)
			Get_string_data(Out_rabbit_tx_arry,65,13)
			Get_string_data(Out_rabbit_tx_arry,67,15)
			Get_string_data(Out_rabbit_tx_arry,68,16)

			Get_string_data(Out_rabbit_tx_arry,74,18) -- 텔레1
			Get_string_data(Out_rabbit_tx_arry,75,17)
			Get_string_data(Out_rabbit_tx_arry,77,19)
			Get_string_data(Out_rabbit_tx_arry,78,20)

			Can_send_deric_out[0], Can_send_deric_out[1] = Split16to8(Out_rabbit_tx_arry[1])
			Can_send_deric_out[2], Can_send_deric_out[3] = Split16to8(Out_rabbit_tx_arry[2])
			Can_send_deric_out[4], Can_send_deric_out[5] = Split16to8(Out_rabbit_tx_arry[3])
			Can_send_deric_out[6], Can_send_deric_out[7] = Split16to8(Out_rabbit_tx_arry[4])

			Can_send_boom2_out[0], Can_send_boom2_out[1] = Split16to8(Out_rabbit_tx_arry[5])
			Can_send_boom2_out[2], Can_send_boom2_out[3] = Split16to8(Out_rabbit_tx_arry[6])
			Can_send_boom2_out[4], Can_send_boom2_out[5] = Split16to8(Out_rabbit_tx_arry[7])
			Can_send_boom2_out[6], Can_send_boom2_out[7] = Split16to8(Out_rabbit_tx_arry[8])

			Can_send_rotate_out[0], Can_send_rotate_out[1] = Split16to8(Out_rabbit_tx_arry[9])
			Can_send_rotate_out[2], Can_send_rotate_out[3] = Split16to8(Out_rabbit_tx_arry[10])
			Can_send_rotate_out[4], Can_send_rotate_out[5] = Split16to8(Out_rabbit_tx_arry[11])
			Can_send_rotate_out[6], Can_send_rotate_out[7] = Split16to8(Out_rabbit_tx_arry[12])

			Can_send_seat_out[0], Can_send_seat_out[1] = Split16to8(Out_rabbit_tx_arry[13])
			Can_send_seat_out[2], Can_send_seat_out[3] = Split16to8(Out_rabbit_tx_arry[14])
			Can_send_seat_out[4], Can_send_seat_out[5] = Split16to8(Out_rabbit_tx_arry[15])
			Can_send_seat_out[6], Can_send_seat_out[7] = Split16to8(Out_rabbit_tx_arry[16])

			Can_send_boom1_out[0], Can_send_boom1_out[1] = Split16to8(Out_rabbit_tx_arry[17])
			Can_send_boom1_out[2], Can_send_boom1_out[3] = Split16to8(Out_rabbit_tx_arry[18])
			Can_send_boom1_out[4], Can_send_boom1_out[5] = Split16to8(Out_rabbit_tx_arry[19])
			Can_send_boom1_out[6], Can_send_boom1_out[7] = Split16to8(Out_rabbit_tx_arry[20])

			Rabbit_out_send_flag = 1
			--Can_out_send()

		end
	end
end


function Lamp_rabbit_touch_process(scr, ctr)
	
	
	if scr == 6 then
		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end
		if ctr == 3 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
			end
			
		
		if ctr == 23 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT4

		elseif ctr == 19 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT4 -- 데릭

		elseif ctr == 21 then   Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT0
		elseif ctr == 24 then
			Rabbit_lamp_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT0


		elseif ctr == 30 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT5 -- 붐2
		elseif ctr == 31 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT5

		elseif ctr == 33 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT6
		elseif ctr == 34 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT6


		elseif ctr == 42 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT6 -- 회전
		elseif ctr == 43 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT6
		elseif ctr == 49 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT2
		elseif ctr == 56 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT2

		elseif ctr == 64 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT7 -- 탑승함회전
		elseif ctr == 65 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT7
		elseif ctr == 66 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT3
		elseif ctr == 68 then
			Rabbit_lamp_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT3

		elseif ctr == 74 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT5 -- 붐1
		elseif ctr == 75 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT5
		elseif ctr == 77 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT1
		elseif ctr == 78 then
			Rabbit_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT1
		end

--[[
		elseif ctr == 40 then

			Rabbit_lamp_change_flag = 1
			local temp_int = 0
			local temp_str = " "
			
			--temp_int = ToSigned8Bit(OR_Rcv_deric_lamp_pos_start)
			temp_str = string.format("%d", OR_Rcv_deric_lamp_pos_start)
			set_text(Current_screen,23,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_deric_lamp_pos_stop)
			temp_str = string.format("%d", OR_Rcv_deric_lamp_pos_stop)
			set_text(Current_screen,19,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_deric_lamp_neg_start)
			temp_str = string.format("%d", OR_Rcv_deric_lamp_neg_start)
			set_text(Current_screen,20,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_deric_lamp_neg_stop)
			temp_str = string.format("%d", OR_Rcv_deric_lamp_neg_stop)
			set_text(Current_screen,24,temp_str)
	
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom2_lamp_pos_start)
			temp_str = string.format("%d", OR_Rcv_boom2_lamp_pos_start)
			set_text(Current_screen,30,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom2_lamp_pos_stop)
			temp_str = string.format("%d", OR_Rcv_boom2_lamp_pos_stop)
			set_text(Current_screen,31,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom2_lamp_neg_start)
			temp_str = string.format("%d", OR_Rcv_boom2_lamp_neg_start)
			set_text(Current_screen,32,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom2_lamp_neg_stop)
			temp_str = string.format("%d", OR_Rcv_boom2_lamp_neg_stop)
			set_text(Current_screen,34,temp_str)
	
	
			--temp_int = ToSigned8Bit(OR_Rcv_rotate_lamp_pos_start)
			temp_str = string.format("%d", OR_Rcv_rotate_lamp_pos_start)
			set_text(Current_screen,42,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_rotate_lamp_pos_stop)
			temp_str = string.format("%d", OR_Rcv_rotate_lamp_pos_stop)
			set_text(Current_screen,43,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_rotate_lamp_neg_start)
			temp_str = string.format("%d", OR_Rcv_rotate_lamp_neg_start)
			set_text(Current_screen,49,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_rotate_lamp_neg_stop)
			temp_str = string.format("%d", OR_Rcv_rotate_lamp_neg_stop)
			set_text(Current_screen,56,temp_str)
	
	
			--temp_int = ToSigned8Bit(OR_Rcv_seat_lamp_pos_start)
			temp_str = string.format("%d", OR_Rcv_seat_lamp_pos_start)
			set_text(Current_screen,64,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_seat_lamp_pos_stop)
			temp_str = string.format("%d", OR_Rcv_seat_lamp_pos_stop)
			set_text(Current_screen,65,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_seat_lamp_neg_start)
			temp_str = string.format("%d", OR_Rcv_seat_lamp_neg_start)
			set_text(Current_screen,66,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_seat_lamp_neg_stop)
			temp_str = string.format("%d", OR_Rcv_seat_lamp_neg_stop)
			set_text(Current_screen,68,temp_str)
	
			
			--temp_int = ToSigned8Bit(OR_Rcv_boom1_lamp_pos_start)
			temp_str = string.format("%d", OR_Rcv_boom1_lamp_pos_start)
			set_text(Current_screen,74,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom1_lamp_pos_stop)
			temp_str = string.format("%d", OR_Rcv_boom1_lamp_pos_stop)
			set_text(Current_screen,75,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom1_lamp_neg_start)
			temp_str = string.format("%d", OR_Rcv_boom1_lamp_neg_start)
			set_text(Current_screen,76,temp_str)
	
			--temp_int = ToSigned8Bit(OR_Rcv_boom1_lamp_neg_stop)
			temp_str = string.format("%d", OR_Rcv_boom1_lamp_neg_stop)
			
			set_text(Current_screen,78,temp_str)


		end
]]--
		
		
		if ctr == 28 and Rabbit_lamp_change_flag == 1 then

			Rabbit_lamp_save_flag= 1
			--set_visiable(Current_screen,21,1)

			Get_string_data(Lamp_rabbit_tx_arry,23,1)
			Get_string_data(Lamp_rabbit_tx_arry,19,2)
			Get_string_data(Lamp_rabbit_tx_arry,20,3)
			Get_string_data(Lamp_rabbit_tx_arry,24,4)

			Get_string_data(Lamp_rabbit_tx_arry,30,5)
			Get_string_data(Lamp_rabbit_tx_arry,31,6)
			Get_string_data(Lamp_rabbit_tx_arry,32,7)
			Get_string_data(Lamp_rabbit_tx_arry,34,8)

			Get_string_data(Lamp_rabbit_tx_arry,42,9)
			Get_string_data(Lamp_rabbit_tx_arry,43,10)
			Get_string_data(Lamp_rabbit_tx_arry,49,11)
			Get_string_data(Lamp_rabbit_tx_arry,56,12)

			Get_string_data(Lamp_rabbit_tx_arry,64,13)
			Get_string_data(Lamp_rabbit_tx_arry,65,14)
			Get_string_data(Lamp_rabbit_tx_arry,66,15)
			Get_string_data(Lamp_rabbit_tx_arry,68,16)

			Get_string_data(Lamp_rabbit_tx_arry,74,17)
			Get_string_data(Lamp_rabbit_tx_arry,75,18)
			Get_string_data(Lamp_rabbit_tx_arry,76,19)
			Get_string_data(Lamp_rabbit_tx_arry,78,20)

			Can_send_deric_b1_lamp[0] = Lamp_rabbit_tx_arry[1]
			Can_send_deric_b1_lamp[1]  = Lamp_rabbit_tx_arry[2]
			Can_send_deric_b1_lamp[2]  = Lamp_rabbit_tx_arry[3]
			Can_send_deric_b1_lamp[3]  = Lamp_rabbit_tx_arry[4]

			Can_send_b2_lamp[0] = Lamp_rabbit_tx_arry[5] -- 64c
			Can_send_b2_lamp[1] = Lamp_rabbit_tx_arry[6]
			Can_send_b2_lamp[2] = Lamp_rabbit_tx_arry[7]
			Can_send_b2_lamp[3] = Lamp_rabbit_tx_arry[8]

			Can_send_rotate_seat_lamp[0] = Lamp_rabbit_tx_arry[9]
			Can_send_rotate_seat_lamp[1] = Lamp_rabbit_tx_arry[10]
			Can_send_rotate_seat_lamp[2] = Lamp_rabbit_tx_arry[11]
			Can_send_rotate_seat_lamp[3] = Lamp_rabbit_tx_arry[12]

			Can_send_rotate_seat_lamp[4] = Lamp_rabbit_tx_arry[13]
			Can_send_rotate_seat_lamp[5] = Lamp_rabbit_tx_arry[14]
			Can_send_rotate_seat_lamp[6] = Lamp_rabbit_tx_arry[15]
			Can_send_rotate_seat_lamp[7] = Lamp_rabbit_tx_arry[16]
			
			Can_send_deric_b1_lamp[4]  = Lamp_rabbit_tx_arry[17] -- 646
			Can_send_deric_b1_lamp[5]  = Lamp_rabbit_tx_arry[18]
			Can_send_deric_b1_lamp[6]  = Lamp_rabbit_tx_arry[19]
			Can_send_deric_b1_lamp[7]  = Lamp_rabbit_tx_arry[20]
			Rabbit_lamp_send_flag = 1
			--Can_lamp_send()

		end
	end

end


function Out_tuttle_touch_process(scr, ctr)

	if scr == 7 then
		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end
		if ctr == 20 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
			end
			

		if ctr == 23 then   --- 파라메터 입력 프로세스
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT0
		elseif ctr == 19 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT0 -- 데릭
		elseif ctr == 21 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT0
		elseif ctr == 24 then
			Tuttle_out_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT0

		elseif ctr == 30 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4 -- 붐2
		elseif ctr == 31 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4
		elseif ctr == 33 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4
		elseif ctr == 34 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT4

		elseif ctr == 42 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2 -- 회전
		elseif ctr == 43 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2
		elseif ctr == 55 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2
		elseif ctr == 56 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT2

		elseif ctr == 64 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3 -- 탑승함회전
		elseif ctr == 65 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3
		elseif ctr == 67 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3
		elseif ctr == 68 then
			Tuttle_out_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT3

		elseif ctr == 74 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1 -- 붐1
		elseif ctr == 75 then
			Tuttle_out_change_flag = 1 
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1
		elseif ctr == 77 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1
		elseif ctr == 78 then
			Tuttle_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT1 end
		--[[	
		if ctr == 85 then --- 거북이 출력 이전값 호출
			
				Tuttle_out_change_flag = 1
				local temp_int = 0
				local temp_str = " "
				temp_int = CombineToSigned16_dec(OT_Rcv_deric_out_pos_stop[1], OT_Rcv_deric_out_pos_stop[2]) -- 데릭 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,23,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_deric_out_pos_start[1], OT_Rcv_deric_out_pos_start[2]) -- 데릭 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,19,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_deric_out_neg_start[1], OT_Rcv_deric_out_neg_start[2]) -- 데릭 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,21,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_deric_out_neg_stop[1], OT_Rcv_deric_out_neg_stop[2]) -- 데릭 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,24,temp_str)
		
				---- 붐2
				temp_int = CombineToSigned16_dec(OT_Rcv_boom2_out_pos_stop[1], OT_Rcv_boom2_out_pos_stop[2]) -- 붐2 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,30,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom2_out_pos_start[1], OT_Rcv_boom2_out_pos_start[2]) -- 붐2 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,31,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom2_out_neg_start[1], OT_Rcv_boom2_out_neg_start[2]) -- 붐2 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,33,temp_str)	
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom2_out_neg_stop[1], OT_Rcv_boom2_out_neg_stop[2]) -- 붐2 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,34,temp_str)
		
				---- 회전
				temp_int = CombineToSigned16_dec(OT_Rcv_rotate_out_pos_stop[1], OT_Rcv_rotate_out_pos_stop[2]) -- 회전 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,42,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_rotate_out_pos_start[1], OT_Rcv_rotate_out_pos_start[2]) -- 회전 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,43,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_rotate_out_neg_start[1], OT_Rcv_rotate_out_neg_start[2]) -- 회전 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,55,temp_str)	
		
				temp_int = CombineToSigned16_dec(OT_Rcv_rotate_out_neg_stop[1], OT_Rcv_rotate_out_neg_stop[2]) -- 회전 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,56,temp_str)
		
				---- 탑승함 회전
				temp_int = CombineToSigned16_dec(OT_Rcv_seat_out_pos_stop[1], OT_Rcv_seat_out_pos_stop[2]) -- 탑승함회전 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,64,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_seat_out_pos_start[1], OT_Rcv_seat_out_pos_start[2]) -- 탑승함회전 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,65,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_seat_out_neg_start[1], OT_Rcv_seat_out_neg_start[2]) --탑승함 회전 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,67,temp_str)	
		
				temp_int = CombineToSigned16_dec(OT_Rcv_seat_out_neg_stop[1], OT_Rcv_seat_out_neg_stop[2]) --탑승함 회전 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,68,temp_str)
		
		
				---- 붐1
				temp_int = CombineToSigned16_dec(OT_Rcv_boom1_out_pos_stop[1], OT_Rcv_boom1_out_pos_stop[2]) -- 붐2 상승 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,74,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom1_out_pos_start[1], OT_Rcv_boom1_out_pos_start[2]) -- 붐2 상승 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,75,temp_str)
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom1_out_neg_start[1], OT_Rcv_boom1_out_neg_start[2]) -- 붐2 하강 시작
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,77,temp_str)	
		
				temp_int = CombineToSigned16_dec(OT_Rcv_boom1_out_neg_stop[1], OT_Rcv_boom1_out_neg_stop[2]) -- 붐2 하강 최대 출력
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,78,temp_str)
		end
		]]--
		if ctr == 32 and Tuttle_out_change_flag == 1 then

			Tuttle_out_save_flag = 1
			--set_visiable(Current_screen,27,1)

			Get_string_data(Out_tuttle_tx_arry,23,2)
			Get_string_data(Out_tuttle_tx_arry,19,1)
			Get_string_data(Out_tuttle_tx_arry,21,3)
			Get_string_data(Out_tuttle_tx_arry,24,4)

			Get_string_data(Out_tuttle_tx_arry,30,6)
			Get_string_data(Out_tuttle_tx_arry,31,5)
			Get_string_data(Out_tuttle_tx_arry,33,7)
			Get_string_data(Out_tuttle_tx_arry,34,8)

			Get_string_data(Out_tuttle_tx_arry,42,10)
			Get_string_data(Out_tuttle_tx_arry,43,9)
			Get_string_data(Out_tuttle_tx_arry,55,11)
			Get_string_data(Out_tuttle_tx_arry,56,12)

			Get_string_data(Out_tuttle_tx_arry,64,14)
			Get_string_data(Out_tuttle_tx_arry,65,13)
			Get_string_data(Out_tuttle_tx_arry,67,15)
			Get_string_data(Out_tuttle_tx_arry,68,16)

			Get_string_data(Out_tuttle_tx_arry,74,18)
			Get_string_data(Out_tuttle_tx_arry,75,17)
			Get_string_data(Out_tuttle_tx_arry,77,19)
			Get_string_data(Out_tuttle_tx_arry,78,20)

			Can_send_deric_out[0], Can_send_deric_out[1] = Split16to8(Out_tuttle_tx_arry[1])
			Can_send_deric_out[2], Can_send_deric_out[3] = Split16to8(Out_tuttle_tx_arry[2])
			Can_send_deric_out[4], Can_send_deric_out[5] = Split16to8(Out_tuttle_tx_arry[3])
			Can_send_deric_out[6], Can_send_deric_out[7] = Split16to8(Out_tuttle_tx_arry[4])

			Can_send_boom2_out[0], Can_send_boom2_out[1] = Split16to8(Out_tuttle_tx_arry[5])
			Can_send_boom2_out[2], Can_send_boom2_out[3] = Split16to8(Out_tuttle_tx_arry[6])
			Can_send_boom2_out[4], Can_send_boom2_out[5] = Split16to8(Out_tuttle_tx_arry[7])
			Can_send_boom2_out[6], Can_send_boom2_out[7] = Split16to8(Out_tuttle_tx_arry[8])

			Can_send_rotate_out[0], Can_send_rotate_out[1] = Split16to8(Out_tuttle_tx_arry[9])
			Can_send_rotate_out[2], Can_send_rotate_out[3] = Split16to8(Out_tuttle_tx_arry[10])
			Can_send_rotate_out[4], Can_send_rotate_out[5] = Split16to8(Out_tuttle_tx_arry[11])
			Can_send_rotate_out[6], Can_send_rotate_out[7] = Split16to8(Out_tuttle_tx_arry[12])

			Can_send_seat_out[0], Can_send_seat_out[1] = Split16to8(Out_tuttle_tx_arry[13])
			Can_send_seat_out[2], Can_send_seat_out[3] = Split16to8(Out_tuttle_tx_arry[14])
			Can_send_seat_out[4], Can_send_seat_out[5] = Split16to8(Out_tuttle_tx_arry[15])
			Can_send_seat_out[6], Can_send_seat_out[7] = Split16to8(Out_tuttle_tx_arry[16])

			Can_send_boom1_out[0], Can_send_boom1_out[1] = Split16to8(Out_tuttle_tx_arry[17])
			Can_send_boom1_out[2], Can_send_boom1_out[3] = Split16to8(Out_tuttle_tx_arry[18])
			Can_send_boom1_out[4], Can_send_boom1_out[5] = Split16to8(Out_tuttle_tx_arry[19])
			Can_send_boom1_out[6], Can_send_boom1_out[7] = Split16to8(Out_tuttle_tx_arry[20])

			Tuttle_out_send_flag = 1
			--Can_out_send()

		end




	end


end

function Lamp_tuttle_touch_process(scr, ctr)
	if scr == 8 then
		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end
		
		if ctr == 21 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
			end
			

		if ctr == 23 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT4

		elseif ctr == 19 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT4 -- 데릭

		elseif ctr == 20 then   Rabbit_out_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT0
		elseif ctr == 24 then
			Tuttle_lamp_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT0


		elseif ctr == 30 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT5 -- 붐2
		elseif ctr == 31 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT5

		elseif ctr == 32 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT6
		elseif ctr == 34 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[5] = Tx_can_rmt_para[5] | BIT6


		elseif ctr == 42 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT6 -- 회전
		elseif ctr == 43 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT6
		elseif ctr == 49 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT2
		elseif ctr == 56 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT2

		elseif ctr == 64 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT7 -- 탑승함회전
		elseif ctr == 65 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT7
		elseif ctr == 66 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT3
		elseif ctr == 68 then
			Tuttle_lamp_change_flag = 1
			 Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT3

		elseif ctr == 74 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT5 -- 붐1
		elseif ctr == 75 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[4] | BIT5
		elseif ctr == 77 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT1
		elseif ctr == 78 then
			Tuttle_lamp_change_flag = 1
			Tx_can_rmt_para[4] = Tx_can_rmt_para[5] | BIT1
		end
		--[[
		elseif ctr == 85 then

			Tuttle_lamp_change_flag = 1
			local temp_int = 0
			local temp_str = " "
			
			--temp_int = ToSigned8Bit(OT_Rcv_deric_lamp_pos_start)
			temp_str = string.format("%d", OT_Rcv_deric_lamp_pos_start)
			set_text(Current_screen,23,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_deric_lamp_pos_stop)
			temp_str = string.format("%d", OT_Rcv_deric_lamp_pos_stop)
			set_text(Current_screen,19,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_deric_lamp_neg_start)
			temp_str = string.format("%d", OT_Rcv_deric_lamp_neg_start)
			set_text(Current_screen,20,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_deric_lamp_neg_stop)
			temp_str = string.format("%d", OT_Rcv_deric_lamp_neg_stop)
			set_text(Current_screen,24,temp_str)
	
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom2_lamp_pos_start)
			temp_str = string.format("%d", OT_Rcv_boom2_lamp_pos_start)
			set_text(Current_screen,30,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom2_lamp_pos_stop)
			temp_str = string.format("%d", OT_Rcv_boom2_lamp_pos_stop)
			set_text(Current_screen,31,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom2_lamp_neg_start)
			temp_str = string.format("%d", OT_Rcv_boom2_lamp_neg_start)
			set_text(Current_screen,32,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom2_lamp_neg_stop)
			temp_str = string.format("%d", OT_Rcv_boom2_lamp_neg_stop)
			set_text(Current_screen,34,temp_str)
	
	
			--temp_int = ToSigned8Bit(OT_Rcv_rotate_lamp_pos_start)
			temp_str = string.format("%d", OT_Rcv_rotate_lamp_pos_start)
			set_text(Current_screen,42,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_rotate_lamp_pos_stop)
			temp_str = string.format("%d", OT_Rcv_rotate_lamp_pos_stop)
			set_text(Current_screen,43,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_rotate_lamp_neg_start)
			temp_str = string.format("%d", OT_Rcv_rotate_lamp_neg_start)
			set_text(Current_screen,49,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_rotate_lamp_neg_stop)
			temp_str = string.format("%d", OT_Rcv_rotate_lamp_neg_stop)
			set_text(Current_screen,56,temp_str)
	
	
			--temp_int = ToSigned8Bit(OT_Rcv_seat_lamp_pos_start)
			temp_str = string.format("%d", OT_Rcv_seat_lamp_pos_start)
			set_text(Current_screen,64,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_seat_lamp_pos_stop)
			temp_str = string.format("%d", OT_Rcv_seat_lamp_pos_stop)
			set_text(Current_screen,65,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_seat_lamp_neg_start)
			temp_str = string.format("%d", OT_Rcv_seat_lamp_neg_start)
			set_text(Current_screen,66,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_seat_lamp_neg_stop)
			temp_str = string.format("%d", OT_Rcv_seat_lamp_neg_stop)
			set_text(Current_screen,68,temp_str)
	
			
			--temp_int = ToSigned8Bit(OT_Rcv_boom1_lamp_pos_start)
			temp_str = string.format("%d", OT_Rcv_boom1_lamp_pos_start)
			set_text(Current_screen,74,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom1_lamp_pos_stop)
			temp_str = string.format("%d", OT_Rcv_boom1_lamp_pos_stop)
			set_text(Current_screen,75,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom1_lamp_neg_start)
			temp_str = string.format("%d", OT_Rcv_boom1_lamp_neg_start)
			set_text(Current_screen,76,temp_str)
	
			--temp_int = ToSigned8Bit(OT_Rcv_boom1_lamp_neg_stop)
			temp_str = string.format("%d", OT_Rcv_boom1_lamp_neg_stop)
			
			set_text(Current_screen,78,temp_str)
		
		end
		]]--
		if ctr == 33 and Tuttle_lamp_change_flag == 1 then

			Tuttle_lamp_save_flag = 1
			--set_visiable(Current_screen,28,1)

			Get_string_data(Lamp_tuttle_tx_arry,23,1)
			Get_string_data(Lamp_tuttle_tx_arry,19,2)
			Get_string_data(Lamp_tuttle_tx_arry,20,3)
			Get_string_data(Lamp_tuttle_tx_arry,24,4)

			Get_string_data(Lamp_tuttle_tx_arry,30,5)
			Get_string_data(Lamp_tuttle_tx_arry,31,6)
			Get_string_data(Lamp_tuttle_tx_arry,32,7)
			Get_string_data(Lamp_tuttle_tx_arry,34,8)

			Get_string_data(Lamp_tuttle_tx_arry,42,9)
			Get_string_data(Lamp_tuttle_tx_arry,43,10)
			Get_string_data(Lamp_tuttle_tx_arry,49,11)
			Get_string_data(Lamp_tuttle_tx_arry,56,12)

			Get_string_data(Lamp_tuttle_tx_arry,64,13)
			Get_string_data(Lamp_tuttle_tx_arry,65,14)
			Get_string_data(Lamp_tuttle_tx_arry,66,15)
			Get_string_data(Lamp_tuttle_tx_arry,68,16)

			Get_string_data(Lamp_tuttle_tx_arry,74,17)
			Get_string_data(Lamp_tuttle_tx_arry,75,18)
			Get_string_data(Lamp_tuttle_tx_arry,76,19)
			Get_string_data(Lamp_tuttle_tx_arry,78,20)

			Can_send_deric_b1_lamp[0] = Lamp_tuttle_tx_arry[1]
			Can_send_deric_b1_lamp[1]  = Lamp_tuttle_tx_arry[2]
			Can_send_deric_b1_lamp[2]  = Lamp_tuttle_tx_arry[3]
			Can_send_deric_b1_lamp[3]  = Lamp_tuttle_tx_arry[4]
			Can_send_b2_lamp[0] = Lamp_tuttle_tx_arry[5]
			Can_send_b2_lamp[1] = Lamp_tuttle_tx_arry[6]
			Can_send_b2_lamp[2] = Lamp_tuttle_tx_arry[7]
			Can_send_b2_lamp[3] = Lamp_tuttle_tx_arry[8]
			Can_send_rotate_seat_lamp[0] = Lamp_tuttle_tx_arry[9]
			Can_send_rotate_seat_lamp[1] = Lamp_tuttle_tx_arry[10]
			Can_send_rotate_seat_lamp[2] = Lamp_tuttle_tx_arry[11]
			Can_send_rotate_seat_lamp[3] = Lamp_tuttle_tx_arry[12]
			Can_send_rotate_seat_lamp[4] = Lamp_tuttle_tx_arry[13]
			Can_send_rotate_seat_lamp[5] = Lamp_tuttle_tx_arry[14]
			Can_send_rotate_seat_lamp[6] = Lamp_tuttle_tx_arry[15]
			Can_send_rotate_seat_lamp[7] = Lamp_tuttle_tx_arry[16]
			
			Can_send_deric_b1_lamp[4]  = Lamp_tuttle_tx_arry[17]
			Can_send_deric_b1_lamp[5]  = Lamp_tuttle_tx_arry[18]
			Can_send_deric_b1_lamp[6]  = Lamp_tuttle_tx_arry[19]
			Can_send_deric_b1_lamp[7]  = Lamp_tuttle_tx_arry[20]
			--Can_out_send()
			Tuttle_lamp_send_flag = 1

		end
	end
end



function Angle_touch_process(scr, ctr)
	local temp_int = 0
	local temp_str = " "
	

	if scr == 9 then
		if ctr== 87 and User_setup_en == 1 then change_screen(3) end
		if ctr== 87 and User_setup_en == 0 then change_screen(13) end
		if ctr == 77 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
			
		end		
		if ctr == 79 then 
			set_visiable(Current_screen,78,0) 
			set_enable(Current_screen,79,0)	
			end
		Min_max_set_touch_cnt = Min_max_set_touch_cnt+1
		if(Min_max_set_touch_cnt%2 == 1) then
			
			if ctr == 19 then
			temp_int =  CombineToSigned16_dec(Rcv_boom_angle_adc[1], Rcv_boom_angle_adc[2])

				if(temp_int<4000) then
					set_visiable(Current_screen,78,1) 
					set_enable(Current_screen,79,1)	

				else 	
				Can_send_min_max[0] = Can_send_min_max[0]|BIT2 -- 각도 MAX
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[0] = 0	-- 대릭 최대각
				temp_int = CombineToSigned16_dec(Rcv_boom_angle_adc[1], Rcv_boom_angle_adc[2]) -- 입려치
				temp_str = string.format("%d",temp_int)
				set_text(Current_screen,31,temp_str)
				end
		
			end		


			if ctr == 5 then
			Can_send_min_max[0] = Can_send_min_max[0]|BIT3  -- 각도 MIN
			canbus_write(0,1609,8,0,0,Can_send_min_max)
			Can_send_min_max[0] = 0	
			temp_int = CombineToSigned16_dec(Rcv_boom_angle_adc[1], Rcv_boom_angle_adc[2]) -- 입려치
			temp_str = string.format("%d",temp_int)
			set_text(Current_screen,43,temp_str)

			end
			
			
			if ctr == 21 then
				Can_send_min_max[0] = Can_send_min_max[0]|BIT6 -- BOOM1 MAX
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[0] = 0	

				temp_int = CombineToSigned16_dec(Rcv_boom1_dist_adc[1], Rcv_boom1_dist_adc[2]) -- 입려치
				temp_str = string.format("%d",temp_int)
				set_text(Current_screen,27,temp_str)
				
			
			end
			if ctr == 23 then  -- 붐2 최소길이 세팅
				temp_int = CombineToSigned16_dec(Rcv_boom1_dist_adc[1], Rcv_boom1_dist_adc[2]) -- 입려치	
				if(temp_int > 600) then
				set_visiable(Current_screen,78,1) 
				set_enable(Current_screen,79,1)	

				else 	
				Can_send_min_max[0] = Can_send_min_max[0]|BIT7 -- BOOM1 MIN
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[0] = 0
				temp_int = CombineToSigned16_dec(Rcv_boom1_dist_adc[1], Rcv_boom1_dist_adc[2]) -- 입려치
				temp_str = string.format("%d",temp_int)
				set_text(Current_screen,65,temp_str)
				end

			end	


			if ctr == 39 then
				Can_send_min_max[1] = Can_send_min_max[1]|BIT5 -- BOOM2 MAX
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[1] = 0	
				temp_int = CombineToSigned16_dec(Rcv_boom2_out_adc[1], Rcv_boom2_out_adc[2]) -- 입려치
				temp_str = string.format("%d",temp_int)
				set_text(Current_screen,55,temp_str)
			end

			if ctr ==  40 then
				temp_int = CombineToSigned16_dec(Rcv_boom2_out_adc[1], Rcv_boom2_out_adc[2]) 
				if(temp_int > 150) then
					set_visiable(Current_screen,78,1) 
					set_enable(Current_screen,79,1)	
	
					else 
					Can_send_min_max[1] = Can_send_min_max[1]|BIT6 -- BOOM2 MIN
					canbus_write(0,1609,8,0,0,Can_send_min_max)
					Can_send_min_max[1] = 0
					temp_int = CombineToSigned16_dec(Rcv_boom2_out_adc[1], Rcv_boom2_out_adc[2]) -- 입려치
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,66,temp_str)
				end	
			end
		end	
	end
end

function Otg_touch_process(scr, ctr)
	local temp_str = " "
	local temp_i = 0
	

	if scr == 10 then
		if ctr== 87 and User_setup_en == 1 then change_screen(3) end
		if ctr== 87 and User_setup_en == 0 then change_screen(13) end
		if ctr == 90 then 
			if Help_show == 1 then set_visiable(Current_screen,35,0) Help_show = 0 
			else  set_visiable(Current_screen,35,1) Help_show = 1 end
			
		end		
		if ctr == 85 then 
			set_visiable(Current_screen,93,0) 
			set_enable(Current_screen,85,0)	
		end

		Min_max_set_touch_cnt = Min_max_set_touch_cnt+1
		if(Min_max_set_touch_cnt%2 == 1) then

			if ctr == 55 then
				local otg_check1 = CombineToSigned16_dec(Rcv_otg_rate_fl_adc[1], Rcv_otg_rate_fl_adc[2])
				local otg_check2 = CombineToSigned16_dec(Rcv_otg_rate_fr_adc[1], Rcv_otg_rate_fr_adc[2])
				local otg_check3 = CombineToSigned16_dec(Rcv_otg_rate_rl_adc[1], Rcv_otg_rate_rl_adc[2])
				local otg_check4 = CombineToSigned16_dec(Rcv_otg_rate_rr_adc[1], Rcv_otg_rate_rr_adc[2])

				if(otg_check1<2400 or otg_check2<2400 or otg_check3<2400 or otg_check4<2400) then
					set_visiable(Current_screen,85,1)
					set_visiable(Current_screen,93,1) 
					set_enable(Current_screen,85,1)	


				else
					Can_send_min_max[0] = Can_send_min_max[0]|BIT0 -- otg MAX
					canbus_write(0,1609,8,0,0,Can_send_min_max)
					Can_send_min_max[0] = 0	-- 대릭 최대각
					
					temp_int = CombineToSigned16_dec(Rcv_otg_rate_fl_adc[1], Rcv_otg_rate_fl_adc[2]) -- 전좌
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,65,temp_str)	

					temp_int = CombineToSigned16_dec(Rcv_otg_rate_fr_adc[1], Rcv_otg_rate_fr_adc[2]) -- 전우
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,67,temp_str)	

					temp_int = CombineToSigned16_dec(Rcv_otg_rate_rl_adc[1], Rcv_otg_rate_rl_adc[2]) -- 후좌
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,69,temp_str)	


					temp_int = CombineToSigned16_dec(Rcv_otg_rate_rr_adc[1], Rcv_otg_rate_rr_adc[2]) -- 후우
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,74,temp_str)	
				end
			end		

			if ctr == 49 then

					Can_send_min_max[0] = Can_send_min_max[0]|BIT1  -- otg MIN
					canbus_write(0,1609,8,0,0,Can_send_min_max)
					Can_send_min_max[0] = 0	

					temp_int = CombineToSigned16_dec(Rcv_otg_rate_fl_adc[1], Rcv_otg_rate_fl_adc[2]) -- 전좌
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,66,temp_str)	

					temp_int = CombineToSigned16_dec(Rcv_otg_rate_fr_adc[1], Rcv_otg_rate_fr_adc[2]) -- 전우
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,68,temp_str)	

					temp_int = CombineToSigned16_dec(Rcv_otg_rate_rl_adc[1], Rcv_otg_rate_rl_adc[2]) -- 후좌
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,71,temp_str)	


					temp_int = CombineToSigned16_dec(Rcv_otg_rate_rr_adc[1], Rcv_otg_rate_rr_adc[2]) -- 후우
					temp_str = string.format("%d",temp_int)
					set_text(Current_screen,75,temp_str)	
				end	
			

		end	
	end
end

function Weight_touch_process(scr, ctr)
	local temp_i = 0
	local temp_int = 0
	local temp_str = " "

	local get_str = " "
	if scr == 11 then
		if ctr== 87 and User_setup_en == 1 then change_screen(3) end
		if ctr== 87 and User_setup_en == 0 then change_screen(13) end
	
		if ctr == 41 then 
			if Help_show == 1 then set_visiable(Current_screen,58,0) Help_show = 0
			else  set_visiable(Current_screen,58,1) Help_show = 1 end
		end		

		if(ctr == 42) then --- 최대하중
			Weight_set_flag = 1
			get_str = get_text(Current_screen, 11)
			temp_i = tonumber(get_str)
			Can_send_min_max[2],Can_send_min_max[3]  = 	Split16to8(temp_i)

			get_str = get_text(Current_screen, 13)
			temp_i = tonumber(get_str)
			Can_send_min_max[4],Can_send_min_max[5]  = 	Split16to8(temp_i)

			get_str = get_text(Current_screen, 65)
			temp_i = tonumber(get_str)
			Can_send_min_max[6],Can_send_min_max[7]  = 	Split16to8(temp_i)
			
			Weight_set_flag = 2
		end	

		
		Min_max_set_touch_cnt = Min_max_set_touch_cnt+1		
		if(Min_max_set_touch_cnt%2 == 1) then

			if ctr == 49 then
				Can_send_min_max[0] = Can_send_min_max[0]|BIT4 -- bascket max weight
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[0] = 0	-- 대릭 최대각
				
				temp_int = CombineToSigned16_dec(Rcv_seat_kg_adc[1], Rcv_seat_kg_adc[2])-- pve roatate
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,31,temp_str)
			end		

			if ctr == 55 then
				Can_send_min_max[0] = Can_send_min_max[0]|BIT5  -- bascekt min weight
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[0] = 0	

				temp_int = CombineToSigned16_dec(Rcv_seat_kg_adc[1], Rcv_seat_kg_adc[2])-- pve roatate
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,7,temp_str)

			end

			if ctr == 28 then
				Can_send_min_max[1] = Can_send_min_max[1]|BIT0  -- rotate_left
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[1] = 0	

				temp_int = CombineToSigned16_dec(Rcv_boom1_rotate_adc[1], Rcv_boom1_rotate_adc[2])-- pve roatate
				temp_str = string.format("%d", temp_int)
				set_text(Current_screen,23,temp_str)

			end

		end	
	end
end

function Tilt_touch_process(scr, ctr)
	local temp_i = 0
	local temp_str = " "
	if scr == 12 then
		if ctr== 87 and User_setup_en == 1 then change_screen(3) end
		if ctr== 87 and User_setup_en == 0 then change_screen(13) end

		if ctr == 41 then 
			if Help_show == 1 then set_visiable(Current_screen,58,0) Help_show = 0 
			else  set_visiable(Current_screen,58,1) Help_show = 1 end
			
		end		

		Min_max_set_touch_cnt = Min_max_set_touch_cnt+1
		if(Min_max_set_touch_cnt%2 == 1) then

			if ctr == 13 then
				Can_send_min_max[1] = Can_send_min_max[1]|BIT2 -- bascket max weight
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[1] = 0	-- 대릭 최대각
				temp_i = CombineToSigned16_dec(Rcv_seat_tilt_adc[1], Rcv_seat_tilt_adc[2])-- pve roatate
				temp_str = string.format("%d", temp_i)
				set_text(Current_screen,10,temp_str)


			end		

			if ctr == 14 then
				Can_send_min_max[1] = Can_send_min_max[1]|BIT1  -- bascekt min weight
				canbus_write(0,1609,8,0,0,Can_send_min_max)
				Can_send_min_max[1] = 0	
				temp_i = CombineToSigned16_dec(Rcv_seat_tilt_adc[1], Rcv_seat_tilt_adc[2])-- pve roatate
				temp_str = string.format("%d", temp_i)
				set_text(Current_screen,11,temp_str)


			end

		end	
	end
end

function User_pw_touch_process(scr, ctr)
	local temp_str = " "
	local password = "2580"

	if scr == 13 then
		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end

		if ctr == 3 then 
			set_visiable(Current_screen,3,0)
			set_enable(Current_screen,3,0)
		end		
	
		
		if ctr == 23 then
			temp_str = get_text(Current_screen, 23) 
			
			if temp_str == password then 
				User_setup_en = 1;
				change_screen(3)
			end
		end	

	end

end
Gpw_str = " "
function Manage_pw_touch_process(scr, ctr)

	local op_str = " "
	if scr == 14 then
		if ctr== 60 and User_setup_en == 1 then change_screen(3) end
		if ctr== 60 and User_setup_en == 0 then change_screen(13) end
		
		if ctr == 3 then 
			set_visiable(Current_screen,3,0)
			set_enable(Current_screen,3,0)
		end		
	
		
		if ctr == 23 then
			Gpw_str = get_text(Current_screen,23)
		    Pw_cal()

			--set_text(Current_screen,3,Gpw_str)
			--set_text(Current_screen,4,Opw_str)

			if Opw_str == Gpw_str then
				Manage_setup_en = 1
				change_screen(9)
			end
		end
	end
end
Weight_zero_cnt = 0;
Weight_send_zero_need_flag = 0;
function Weight_zeroset(scr, ctr)


	if scr == 15 then


		if ctr== 88 and Manage_setup_en == 1 then change_screen(9) end
		if ctr== 88 and Manage_setup_en == 0 then change_screen(14) end
		
		if ctr == 12 then 
			if Help_show == 1 then set_visiable(Current_screen,58,0) Help_show = 0 
			else  set_visiable(Current_screen,58,1) Help_show = 1 end
			
		end		

		if ctr == 19 then
			Weight_zero_cnt = Weight_zero_cnt+1
			if Weight_zero_cnt%2 == 1 then 
			Tx_can_mode_and_rmt[6] = 1
			canbus_write(0,0x647,8,0,0,Tx_can_mode_and_rmt)
			Tx_can_mode_and_rmt[6] = 0
			Weight_send_zero_need_flag = 2;

			end
		end
	end

end	

function Angle_touch_process(screen, control)
	if screen == 16 then
		if control == 10 then change_screen(0) end
	end
end

function on_control_notify(screen,control,value)

    monitor_touch_process(screen,control)
	diago1_touch_process(screen,control)
	diago4_touch_process(screen,control)
	User_pw_touch_process(screen,control)
	Manage_pw_touch_process(screen,control)

	Out_rabbit_touch_process(screen,control)
	Out_tuttle_touch_process(screen,control)
	Lamp_tuttle_touch_process(screen,control)
	Lamp_rabbit_touch_process(screen,control)
    Angle_touch_process(screen, control)
	Otg_touch_process(screen,control)
	Weight_touch_process(screen,control)
	Tilt_touch_process(screen,control)
	Rmt_axis_touch_process(screen, control)
	Weight_zeroset(screen, control)
	Rmt_dir_touch_process(screen, control, value)

end


