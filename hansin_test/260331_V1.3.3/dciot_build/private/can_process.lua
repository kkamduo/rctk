--- id 미정
--Rcv_safe_rate = 0
Rcv_limit_area = {0,0}
Rcv_work_area = {0,0}

-- 수평계 각도센서
Rcv_x_angle = {0, 0}
Rcv_y_angle = {0, 0}
Rcv_offset_x = {0, 0}
Rcv_offset_y = {0, 0}
Rcv_offset_set = 0
Rcv_offset_rotate = 0
Rcv_sol_state = 0

--Rcv_boom2_dist_adc={0,0} -- 1,2
--Rcv_boom2_dist={0,0} -- 1,2

local send_data_buffer = {}
----- monitor_diago
--id 1000
Rcv_seat_kg_adc ={0,0} --1,2
Rcv_wind ={0,0} --5,6
Rcv_seat_tilt_adc ={0,0} --7,8




--id 1001

Rcv_wind_adc = {0,0} -- 1,2
Rcv_left_rotate_stop = 0 --3 
Rcv_right_rotate_stop = 0  --4 
--id 1101
Rcv_weight_lmt = {0,0} -- 1,2


--- ID 1102
Rcv_battery_volt = {0,0} -- 1,2
Rcv_seat_tilt = {0,0} -- 3,4

Rcv_otg_rate_fl = 0 --5
Rcv_otg_rate_fr = 0 --6
Rcv_otg_rate_rl = 0 --7
Rcv_otg_rate_rr = 0 --8

--id 1103-
Rcv_seat_kg = {0,0} -- 5,6

--id 1104
Rcv_work_area={0,0} -- 1,2
Rcv_boom_angle={0,0} -- 3,4
Rcv_boom1_rotate={0,0} -- 5,6
Rcv_limit_area={0,0} -- 7,8

--id 1105
Rcv_boom1_dist_adc={0,0} -- 1,2
Rcv_boom1_rotate_adc={0,0} -- 3,4
Rcv_boom_angle_adc={0,0} -- 5,6
Rcv_boom1_heigt ={0,0} -- 7,8

--id 1106
Rcv_otg_rate_fl_adc ={0,0} --1,2
Rcv_otg_rate_fr_adc ={0,0} --3,4
Rcv_otg_rate_rl_adc ={0,0} --5,6
Rcv_otg_rate_rr_adc ={0,0} --7,8

-- id 1107
Rcv_io_ind = {0,0,0,0,0,0,0,0}
-- id 1108
Rcv_boom1_out_lenght = {0,0}
Rcv_safe_rate = {0,0}
Rcv_boom2_out_adc = {0,0}
Rcv_boom2_out_lenght = {0,0}
-- id 
Rcv_boomt_out_lenght = {0,0}


--------------------- old_lamp tuttle
OT_Rcv_deric_lamp_pos_start = 0
OT_Rcv_deric_lamp_pos_stop = 0
OT_Rcv_deric_lamp_neg_start = 0
OT_Rcv_deric_lamp_neg_stop = 0
OT_Rcv_boom1_lamp_pos_start = 0
OT_Rcv_boom1_lamp_pos_stop = 0
OT_Rcv_boom1_lamp_neg_start = 0
OT_Rcv_boom1_lamp_neg_stop = 0

OT_Rcv_rotate_lamp_pos_start = 0
OT_Rcv_rotate_lamp_pos_stop = 0
OT_Rcv_rotate_lamp_neg_start = 0
OT_Rcv_rotate_lamp_neg_stop = 0
OT_Rcv_seat_lamp_pos_start = 0
OT_Rcv_seat_lamp_pos_stop = 0
OT_Rcv_seat_lamp_neg_start = 0
OT_Rcv_seat_lamp_neg_stop = 0

OT_Rcv_boom2_lamp_pos_start = 0
OT_Rcv_boom2_lamp_pos_stop = 0
OT_Rcv_boom2_lamp_neg_start = 0
OT_Rcv_boom2_lamp_neg_stop = 0

--------------------- old_lamp Rabbit
OR_Rcv_deric_lamp_pos_start = 0
OR_Rcv_deric_lamp_pos_stop = 0
OR_Rcv_deric_lamp_neg_start = 0
OR_Rcv_deric_lamp_neg_stop = 0
OR_Rcv_boom1_lamp_pos_start = 0
OR_Rcv_boom1_lamp_pos_stop = 0
OR_Rcv_boom1_lamp_neg_start = 0
OR_Rcv_boom1_lamp_neg_stop = 0

OR_Rcv_rotate_lamp_pos_start = 0
OR_Rcv_rotate_lamp_pos_stop = 0
OR_Rcv_rotate_lamp_neg_start = 0
OR_Rcv_rotate_lamp_neg_stop = 0
OR_Rcv_seat_lamp_pos_start = 0
OR_Rcv_seat_lamp_pos_stop = 0
OR_Rcv_seat_lamp_neg_start = 0
OR_Rcv_seat_lamp_neg_stop = 0

OR_Rcv_boom2_lamp_pos_start = 0
OR_Rcv_boom2_lamp_pos_stop = 0
OR_Rcv_boom2_lamp_neg_start = 0
OR_Rcv_boom2_lamp_neg_stop = 0

------------------RMT OUT OR
-- id 111
OR_Rcv_deric_out_pos_start = {0,0}
OR_Rcv_deric_out_pos_stop = {0,0}
OR_Rcv_deric_out_neg_start = {0,0}
OR_Rcv_deric_out_neg_stop = {0,0}

--id 1109
OR_Rcv_boom1_out_pos_start = {0,0}
OR_Rcv_boom1_out_pos_stop = {0,0}
OR_Rcv_boom1_out_neg_start = {0,0}
OR_Rcv_boom1_out_neg_stop = {0,0}

--id 1110
OR_Rcv_rotate_out_pos_start = {0,0}
OR_Rcv_rotate_out_pos_stop = {0,0}
OR_Rcv_rotate_out_neg_start = {0,0}
OR_Rcv_rotate_out_neg_stop = {0,0}

--id 1111
OR_Rcv_seat_out_pos_start = {0,0}
OR_Rcv_seat_out_pos_stop = {0,0}
OR_Rcv_seat_out_neg_start = {0,0}
OR_Rcv_seat_out_neg_stop = {0,0}

OR_Rcv_boom2_out_pos_start = {0,0}
OR_Rcv_boom2_out_pos_stop = {0,0}
OR_Rcv_boom2_out_neg_start = {0,0}
OR_Rcv_boom2_out_neg_stop = {0,0}

------------------RMT OUT OT
-- id 111
OT_Rcv_deric_out_pos_start = {0,0}
OT_Rcv_deric_out_pos_stop = {0,0}
OT_Rcv_deric_out_neg_start = {0,0}
OT_Rcv_deric_out_neg_stop = {0,0}

--id 1109
OT_Rcv_boom1_out_pos_start = {0,0}
OT_Rcv_boom1_out_pos_stop = {0,0}
OT_Rcv_boom1_out_neg_start = {0,0}
OT_Rcv_boom1_out_neg_stop = {0,0}

--id 1110
OT_Rcv_rotate_out_pos_start = {0,0}
OT_Rcv_rotate_out_pos_stop = {0,0}
OT_Rcv_rotate_out_neg_start = {0,0}
OT_Rcv_rotate_out_neg_stop = {0,0}

--id 1111
OT_Rcv_seat_out_pos_start = {0,0}
OT_Rcv_seat_out_pos_stop = {0,0}
OT_Rcv_seat_out_neg_start = {0,0}
OT_Rcv_seat_out_neg_stop = {0,0}

OT_Rcv_boom2_out_pos_start = {0,0}
OT_Rcv_boom2_out_pos_stop = {0,0}
OT_Rcv_boom2_out_neg_start = {0,0}
OT_Rcv_boom2_out_neg_stop = {0,0}

-------rmt lamp
---id 1112
Rcv_deric_lamp_pos_start = 0
Rcv_deric_lamp_pos_stop = 0
Rcv_deric_lamp_neg_start = 0
Rcv_deric_lamp_neg_stop = 0
Rcv_boom1_lamp_pos_start = 0
Rcv_boom1_lamp_pos_stop = 0
Rcv_boom1_lamp_neg_start = 0
Rcv_boom1_lamp_neg_stop = 0

---id 1113
Rcv_rotate_lamp_pos_start = 0
Rcv_rotate_lamp_pos_stop = 0
Rcv_rotate_lamp_neg_start = 0
Rcv_rotate_lamp_neg_stop = 0
Rcv_seat_lamp_pos_start = 0
Rcv_seat_lamp_pos_stop = 0
Rcv_seat_lamp_neg_start = 0
Rcv_seat_lamp_neg_stop = 0

--- id 1114 리모콘 방향설정
Rcv_rmt_dir1 = 0
Rcv_rmt_dir2 = 0
Rcv_rmt_dir3 = 0
Rcv_rmt_dir4 = 0
Rcv_mode_fast = 0


---id 1121
Rcv_boom2_lamp_pos_start = 0
Rcv_boom2_lamp_pos_stop = 0
Rcv_boom2_lamp_neg_start = 0
Rcv_boom2_lamp_neg_stop = 0
Rcv_pve_boom2 = {0,0}

---- rmt out set
-- id 111
Rcv_deric_out_pos_start = {0,0}
Rcv_deric_out_pos_stop = {0,0}
Rcv_deric_out_neg_start = {0,0}
Rcv_deric_out_neg_stop = {0,0}

--id 1109
Rcv_boom1_out_pos_start = {0,0}
Rcv_boom1_out_pos_stop = {0,0}
Rcv_boom1_out_neg_start = {0,0}
Rcv_boom1_out_neg_stop = {0,0}

--id 1110
Rcv_rotate_out_pos_start = {0,0}
Rcv_rotate_out_pos_stop = {0,0}
Rcv_rotate_out_neg_start = {0,0}
Rcv_rotate_out_neg_stop = {0,0}

--id 1111
Rcv_seat_out_pos_start = {0,0}
Rcv_seat_out_pos_stop = {0,0}
Rcv_seat_out_neg_start = {0,0}
Rcv_seat_out_neg_stop = {0,0}
-- id 1116
Rcv_max_weight_set = {0,0}
Rcv_min_weight_set = {0,0}
Rcv_lmt_weight_set = {0,0}
Rcv_boom_lenght_set = {0,0}

--- id 1117
Rcv_pve_deric = {0,0}
Rcv_pve_boom = {0,0}
Rcv_pve_rotate = {0,0}
Rcv_pve_seat = {0,0}






--id 1120
Rcv_boom2_out_pos_start = {0,0}
Rcv_boom2_out_pos_stop = {0,0}
Rcv_boom2_out_neg_start = {0,0}
Rcv_boom2_out_neg_stop = {0,0}


--id 1115
Rcv_rmt_deric = 0
Rcv_rmt_rotate = 0
Rcv_rmt_shirnk = 0
Rcv_rmt_bucket = 0
Rcv_rmt_tilt = 0



Rcv_alarm_msg = {0,0,0,0,0}
Rcv_alarm_msg_old = {0,0,0,0,0}

Rcv_500kg = {0,0}



local event_str = " "
Time_date = " "
Record_str = " "
Can_rcv_cnt = 0
	





local rcv_data = {0X8,0,0,0, 0,0,0,0}
function on_canbus_recv (index,identifier,dlc,rtr,ide,data)



	if identifier ==  1000  then -- battery, sheet angle, otg		
		Rcv_seat_kg_adc[1] = data[0]
		Rcv_seat_kg_adc[2] = data[1] 


		--Rcv_wind[1] = data[4]
		--Rcv_wind[2] = data[5]
		Rcv_seat_tilt_adc[1] = data[6]
		Rcv_seat_tilt_adc[2]= data[7]
	

	elseif identifier ==  1001 then
		Rcv_wind_adc[1] = data[0]
		Rcv_wind_adc[2] = data[1]
		Rcv_left_rotate_stop = data[2]
		Rcv_right_rotate_stop = data[3]


	elseif identifier ==  1101 then
		Rcv_weight_lmt[1] = data[2]
		Rcv_weight_lmt[2] = data[3]



	elseif identifier ==  1102 then
		--Can_rcv_cnt = Can_rcv_cnt+1
		Rcv_battery_volt[1] = data[0]
		Rcv_battery_volt[2] = data[1]
		Rcv_seat_tilt[1] = data[2]
		Rcv_seat_tilt[2] = data[3]
		Rcv_otg_rate_fl = data[4]
		Rcv_otg_rate_fr = data[5]
		Rcv_otg_rate_rl = data[6]
		Rcv_otg_rate_rr = data[7]

	elseif identifier ==  1103 then
		Rcv_alarm_msg[2] = data[0]
		Rcv_alarm_msg[1] = data[1]
		Rcv_alarm_msg[4] = data[2]
		Rcv_alarm_msg[3] = data[3]
		Rcv_seat_kg[1] = data[4]
		Rcv_seat_kg[2] = data[5]

	elseif identifier ==  1104 then
		Rcv_work_area[1] = data[0]
		Rcv_work_area[2] = data[1]
		Rcv_boom_angle[1] = data[2]
		Rcv_boom_angle[2] = data[3]
		Rcv_boom1_rotate[1] = data[4]
		Rcv_boom1_rotate[2] = data[5]
		Rcv_limit_area[1] = data[6]
		Rcv_limit_area[2] = data[7]

	elseif identifier ==  1105 then
		Rcv_boom1_dist_adc[1] = data[0]
		Rcv_boom1_dist_adc[2] = data[1]
		Rcv_boom1_rotate_adc[1] = data[2]
		Rcv_boom1_rotate_adc[2] = data[3]
		Rcv_boom_angle_adc[1] = data[4]
		Rcv_boom_angle_adc[2] = data[5]
		Rcv_boom1_heigt[1] = data[6]
		Rcv_boom1_heigt[2] = data[7]

	elseif identifier ==  1106 then
		Rcv_otg_rate_fr_adc[1] = data[0]
		Rcv_otg_rate_fr_adc[2] = data[1]
		Rcv_otg_rate_rr_adc[1] = data[2]
		Rcv_otg_rate_rr_adc[2] = data[3]
		Rcv_otg_rate_fl_adc[1] = data[4]
		Rcv_otg_rate_fl_adc[2] = data[5]
		Rcv_otg_rate_rl_adc[1] = data[6]
		Rcv_otg_rate_rl_adc[2] = data[7]


	elseif identifier ==  1107 then
		Rcv_io_ind[0] = data[0]
		Rcv_io_ind[1] = data[1]
		Rcv_io_ind[2] = data[2]
		Rcv_io_ind[3] = data[3]
		Rcv_io_ind[4] = data[4]
		Rcv_io_ind[5] = data[5]
		Rcv_io_ind[6] = data[6]
		Rcv_io_ind[7] = data[7]
		Rcv_sol_state = Bit_mask_bit(data[5], BIT5)


	elseif identifier ==  1118 then --- 1108 -> 1118 240627
		Rcv_boom1_out_lenght[1] = data[0]
		Rcv_boom1_out_lenght[2] = data[1]
		Rcv_safe_rate[1] = data[2]
		Rcv_safe_rate[2] = data[3]
		Rcv_boom2_out_adc[1] = data[4]
		Rcv_boom2_out_adc[2] = data[5]
		Rcv_boom2_out_lenght[1] = data[6]
		Rcv_boom2_out_lenght[2] = data[7]



	elseif identifier ==  1108 then  -- pve 출력 수신 데릭 --- 111 ->1108 240627
		Rcv_deric_out_pos_start[1] = data[0]
		Rcv_deric_out_pos_start[2] = data[1]
		Rcv_deric_out_pos_stop[1] = data[2]
		Rcv_deric_out_pos_stop[2] = data[3]
		Rcv_deric_out_neg_start[1] = data[4]
		Rcv_deric_out_neg_start[2] = data[5]
		Rcv_deric_out_neg_stop[1] = data[6]
		Rcv_deric_out_neg_stop[2] = data[7]

	elseif identifier ==  1109 then --pve 출력 세팅 붐1
		Rcv_boom1_out_pos_start[1] = data[0]
		Rcv_boom1_out_pos_start[2] = data[1]
		Rcv_boom1_out_pos_stop[1] = data[2]
		Rcv_boom1_out_pos_stop[2] = data[3]
		Rcv_boom1_out_neg_start[1] = data[4]
		Rcv_boom1_out_neg_start[2] = data[5]
		Rcv_boom1_out_neg_stop[1] = data[6]
		Rcv_boom1_out_neg_stop[2] = data[7]

	elseif identifier ==  1110 then   --pve 출력 세팅 회전
		Rcv_rotate_out_pos_start[1] = data[0]
		Rcv_rotate_out_pos_start[2] = data[1]
		Rcv_rotate_out_pos_stop[1] = data[2]
		Rcv_rotate_out_pos_stop[2] = data[3]
		Rcv_rotate_out_neg_start[1] = data[4]
		Rcv_rotate_out_neg_start[2] = data[5]
		Rcv_rotate_out_neg_stop[1] = data[6]
		Rcv_rotate_out_neg_stop[2] = data[7]

	elseif identifier ==  1111 then -- pve 출력 세팅 탑승함
		Rcv_seat_out_pos_start[1] = data[0]
		Rcv_seat_out_pos_start[2] = data[1]
		Rcv_seat_out_pos_stop[1] = data[2]
		Rcv_seat_out_pos_stop[2] = data[3]
		Rcv_seat_out_neg_start[1] = data[4]
		Rcv_seat_out_neg_start[2] = data[5]
		Rcv_seat_out_neg_stop[1] = data[6]
		Rcv_seat_out_neg_stop[2] = data[7]



	elseif identifier ==  1112 then -- 데릭,붐1 램프 세팅
		Rcv_deric_lamp_pos_start = data[0]
		Rcv_deric_lamp_pos_stop = data[1]
		Rcv_deric_lamp_neg_start = data[2]
		Rcv_deric_lamp_neg_stop = data[3]
		Rcv_boom1_lamp_pos_start = data[4]
		Rcv_boom1_lamp_pos_stop = data[5]
		Rcv_boom1_lamp_neg_start = data[6]
		Rcv_boom1_lamp_neg_stop = data[7]


	elseif identifier ==  1113 then --회전 탑슴함 램프 세팅
		Rcv_rotate_lamp_pos_start = data[0]
		Rcv_rotate_lamp_pos_stop = data[1]
		Rcv_rotate_lamp_neg_start = data[2]
		Rcv_rotate_lamp_neg_stop = data[3]
		Rcv_seat_lamp_pos_start = data[4]
		Rcv_seat_lamp_pos_stop = data[5]
		Rcv_seat_lamp_neg_start = data[6]
		Rcv_seat_lamp_neg_stop = data[7]


	elseif identifier ==  1114 then --rmt dir, mode
		Rcv_rmt_dir1 = data[0]
		Rcv_rmt_dir2 = data[1]
		Rcv_rmt_dir3 = data[2]
		Rcv_rmt_dir4 = data[3]
		Get_current_mode = data[4] 

	elseif identifier ==  1116 then --rmt dir, mode
		Rcv_max_weight_set[1] = data[0]
		Rcv_max_weight_set[2] = data[1]
		Rcv_min_weight_set[1] = data[2]
		Rcv_min_weight_set[2] = data[3]
		Rcv_lmt_weight_set[1] = data[4]
		Rcv_lmt_weight_set[2] = data[5]
		Rcv_boom_lenght_set[1] = data[6]
		Rcv_boom_lenght_set[2] = data[7]

	
	elseif identifier ==  1117 then --rmt dir, mode
		Rcv_pve_deric[1] = data[0]
		Rcv_pve_deric[2] = data[1]
		Rcv_pve_boom[1] = data[2]
		Rcv_pve_boom[2] = data[3]
		Rcv_pve_rotate[1] = data[4]
		Rcv_pve_rotate[2] = data[5]
		Rcv_pve_seat[1] = data[6]
		Rcv_pve_seat[2] = data[7]
	
	elseif identifier ==  1119 then --rmt dir, mode
		Rcv_boomt_out_lenght[1] = data[0]
		Rcv_boomt_out_lenght[2] = data[1]
		Rcv_wind[1] = data[2]
		Rcv_wind[2] = data[3]
		Rcv_alarm_msg[5] = 	data[4]
		Rcv_500kg[1] = data[6]
		Rcv_500kg[2] = data[7]


	elseif identifier ==  1120 then  --붐2 출력
		Rcv_boom2_out_pos_start[1] = data[0]
		Rcv_boom2_out_pos_start[2] = data[1]
		Rcv_boom2_out_pos_stop[1] = data[2]
		Rcv_boom2_out_pos_stop[2] = data[3]
		Rcv_boom2_out_neg_start[1] = data[4]
		Rcv_boom2_out_neg_start[2] = data[5]
		Rcv_boom2_out_neg_stop[1] = data[6]
		Rcv_boom2_out_neg_stop[2] = data[7]

		
	

	elseif identifier ==  1121 then -- 붐2 램프 세팅
	Rcv_boom2_lamp_pos_start = data[0]
	Rcv_boom2_lamp_pos_stop = data[1]
	Rcv_boom2_lamp_neg_start = data[2]
	Rcv_boom2_lamp_neg_stop = data[3]
	Rcv_pve_boom2[1] =  data[4]
	Rcv_pve_boom2[2] =  data[5]
	

	elseif identifier ==  1115 then -- 붐2 램프 세팅
	Rcv_rmt_deric = data[0]
	Rcv_rmt_rotate = data[2]
	Rcv_rmt_shirnk = data[1]
	Rcv_rmt_bucket = data[3]
	Rcv_rmt_tilt = data[4]

	elseif identifier == 0x18a then -- 수평계 X/Y 각도
		Rcv_x_angle[1] = data[0]
		Rcv_x_angle[2] = data[1]
		Rcv_y_angle[1] = data[2]
		Rcv_y_angle[2] = data[3]

	elseif identifier == 0x18b then -- 수평계 오프셋/회전 설정
		Rcv_offset_x[1] = data[0]
		Rcv_offset_x[2] = data[1]
		Rcv_offset_y[1] = data[2]
		Rcv_offset_y[2] = data[3]
		Rcv_offset_rotate = data[4]
		Rcv_offset_set = data[5]

	end



end

function Can_weight_send()
	if Ms_5_cnt == 13 then canbus_write(0,1609,8,0,0,Can_send_min_max) end
end	

function Can_out_send()

	if Can_send_cnt == 1 then canbus_write(0,0x647,7,0,0,Tx_can_mode_and_rmt) end
	--if Ms_5_cnt == 12 then canbus_write(0,1118,8,0,0,Tx_can_rmt_para) end
	if Can_send_cnt == 2 then canbus_write(0,1602,8,0,0,Can_send_deric_out)end
	if Can_send_cnt == 3 then canbus_write(0,1611,8,0,0,Can_send_boom2_out)end
	if Can_send_cnt == 4 then canbus_write(0,1604,8,0,0,Can_send_rotate_out)end
	if Can_send_cnt == 5 then canbus_write(0,1605,8,0,0,Can_send_seat_out)end	
	if Can_send_cnt == 6 then canbus_write(0,1603,8,0,0,Can_send_boom1_out) 
		Rabbit_out_send_flag = 0
		Tuttle_out_send_flag = 0
		Rabbit_out_change_flag = 0
		Tuttle_out_change_flag = 0
		Can_send_cnt = 0
		Can_out_send_flag = 0
	end	
	
end	


function Can_lamp_send()

	if Can_send_cnt == 1 then canbus_write(0,0x647,7,0,0,Tx_can_mode_and_rmt) end
	--if Can_send_cnt == 1 then canbus_write(0,1118,8,0,0,Tx_can_rmt_para) end
	if Can_send_cnt == 2 then canbus_write(0,1606,8,0,0,Can_send_deric_b1_lamp)end
	if Can_send_cnt == 3 then canbus_write(0,1608,8,0,0,Can_send_rotate_seat_lamp)end
	if Can_send_cnt == 4 then canbus_write(0,1612,4,0,0,Can_send_b2_lamp)
		Rabbit_lamp_send_flag = 0
		Tuttle_lamp_send_flag = 0
		Rabbit_lamp_change_flag = 0
		Tuttle_lamp_change_flag = 0
		Can_send_cnt = 0
		Can_lamp_send_flag = 0

	end

end	
