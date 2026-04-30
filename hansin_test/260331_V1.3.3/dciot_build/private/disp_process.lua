


local RED = 0xF800
local BLUE = 0x001f
local GREEN = 0x07e0
local DARK_WHITE = 0xFFDF
local PASTEL_YELLOW = 0XFFD4
local Title_Blue = 0x033F

local pass_word_setup = "1234"

Lamp_tuttle_first_check = 0
Lamp_rabbit_first_check = 0

Out_tuttle_first_check = 0
Out_rabbit_first_check = 0



local ipaddr = " "
local dhcp = " "
local netmask = " "
local gateway = " "
local dns = " "

local can_buff = {8,7,6,5,4,3,2,1}
local pw_check = " "
Help_show = 0

Seat_total_weight = 500

Out_rabbit_rx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Lamp_rabbit_rx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Out_tuttle_rx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Lamp_tuttle_rx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}


Out_rabbit_tx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Lamp_rabbit_tx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Out_tuttle_tx_arry = {0,0,0,0,0   ,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}
Lamp_tuttle_tx_arry = {0,0,0,0,0	,0,0,0,0,0, 0,0,0,0,0 ,0,0,0,0,0, 0}

MSG_color_cnt = 0

function Monitor_screen_process()
	
	local temp_str = " "
	local temp_int = 0
	local temp_float = 0.0
	local temp_round = 0.0
	local temp_decimal = 0
	dhcp, ipaddr, netmask, gateway, dns = get_network_cfg()
	temp_str = string.format("%s",temp_float)
	set_text(Current_screen,59,ipaddr)

	if Alam_cnt>0 then
		MSG_color_cnt = MSG_color_cnt+1
		if MSG_color_cnt  == 5 then 
			set_fore_color(Current_screen,200,Title_Blue)
		end
		if MSG_color_cnt  == 10 then 
			set_fore_color(Current_screen,200,RED)
			MSG_color_cnt = 0
		end
	end 
	set_visiable(Current_screen,24,USB_check) 
		
	
	---배터리
	temp_float = CombineToSigned16_f10(Rcv_battery_volt[1], Rcv_battery_volt[2])
	temp_str = string.format("%.1fV",temp_float)
	set_text(Current_screen,68,temp_str)

		---seat weight
	temp_int = CombineToSigned16_dec(Rcv_seat_kg[1], Rcv_seat_kg[2])
	Seat_total_weight = CombineToSigned16_dec(Rcv_weight_lmt[1], Rcv_weight_lmt[2])
	temp_str = string.format("%d/%dkg",Seat_total_weight,temp_int)
	set_text(Current_screen,27,temp_str)

	---붐회전
	temp_int = CombineToSigned16_dec(Rcv_boom1_rotate[1], Rcv_boom1_rotate[2])
	--temp_int = temp_int-360
	temp_str = string.format("%d{", temp_int)
	set_text(Current_screen,29,temp_str)

	---붐상하
	temp_float = CombineToSigned16_f10(Rcv_boom_angle[1], Rcv_boom_angle[2])
	--temp_int = temp_int-360
	temp_round = temp_float%1
	temp_int  = temp_float-temp_round
	if(temp_round > 0.4) then temp_int = temp_int+1 end

	temp_str = string.format("%d{", temp_int)
	set_text(Current_screen,30,temp_str)

	---작업높이
	temp_float = CombineToSigned16_f100(Rcv_boom1_heigt[1], Rcv_boom1_heigt[2])
	temp_str = string.format("%.2fm", temp_float)
	set_text(Current_screen,31,temp_str)

	
	---안전율
	temp_int = CombineToSigned16_dec(Rcv_safe_rate[1], Rcv_safe_rate[2])
	temp_str = string.format("%d%%", temp_int)
	set_text(Current_screen,32,temp_str)

	---틸팅각도
	temp_int = CombineToSigned16_dec(Rcv_seat_tilt[1], Rcv_seat_tilt[2])
	temp_str = string.format("%d{", temp_int)
	set_text(Current_screen,33,temp_str)

	---풍속
	temp_int = CombineToSigned16_dec(Rcv_wind[1], Rcv_wind[2])
	temp_str = string.format("%dm/s", temp_int)
	set_text(Current_screen,34,temp_str)

	---붐인출길이
	temp_float = CombineToSigned16_f100(Rcv_boomt_out_lenght[1], Rcv_boomt_out_lenght[2])
	temp_str = string.format("%.2fm", temp_float)
	set_text(Current_screen,70,temp_str)

	---제한반경
	temp_float = CombineToSigned16_f100(Rcv_limit_area[1], Rcv_limit_area[2])
	temp_str = string.format("%.2fm", temp_float)
	set_text(Current_screen,64,temp_str)

	---작업반경
	temp_float = CombineToSigned16_f100(Rcv_work_area[1], Rcv_work_area[2])
	temp_str = string.format("%.2fm", temp_float)
	set_text(Current_screen,65,temp_str)

	--- 아우트리거 길이 2952
	set_value(Current_screen,26,Rcv_otg_rate_fl)
	set_value(Current_screen,19,Rcv_otg_rate_fr)
	set_value(Current_screen,16,Rcv_otg_rate_rl)
	set_value(Current_screen,21,Rcv_otg_rate_rr)

	temp_str = string.format("%d%%", Rcv_otg_rate_fl)
	set_text(Current_screen,63,temp_str)

	temp_str = string.format("%d%%", Rcv_otg_rate_fr)
	set_text(Current_screen,71,temp_str)

	temp_str = string.format("%d%%", Rcv_otg_rate_rl)
	set_text(Current_screen,62,temp_str)

	temp_str = string.format("%d%%", Rcv_otg_rate_rr)
	set_text(Current_screen,72,temp_str)



	--- 아우트리거 잭들림 	
	temp_int = Bit_mask_bit_n(Rcv_io_ind[2], BIT0) -- fl
	set_value(Current_screen,12,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[2], BIT1) -- fr
	set_value(Current_screen,22,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[2], BIT2) --rl
	set_value(Current_screen,25,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[2], BIT3) --rr
	set_value(Current_screen,23,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT0) --회전원점
	set_value(Current_screen,67,temp_int)



end


function Diago1_process()
	local temp_str = " "
	local temp_int = 0
	local temp_ind = 0
	local temp_float = 0.0


	if Alam_cnt>0 then
		MSG_color_cnt = MSG_color_cnt+1
		if MSG_color_cnt  == 5 then 
			set_fore_color(Current_screen,200,Title_Blue)
		end
		if MSG_color_cnt  == 10 then 
			set_fore_color(Current_screen,200,RED)
			MSG_color_cnt = 0
		end
	end 
	--- 탑승함 kG
	temp_int = CombineToSigned16_dec(Rcv_seat_kg_adc[1], Rcv_seat_kg_adc[2]) -- 입력치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,96,temp_str)

	temp_ind = Range_to_bit(temp_int, 100,4500) --- 에러표시
	set_value(Current_screen,19,temp_ind)

	temp_int = CombineToSigned16_dec(Rcv_seat_kg[1], Rcv_seat_kg[2]) -- 환산치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,97,temp_str)



	--- 붐각도
	temp_int = CombineToSigned16_dec(Rcv_boom_angle_adc[1], Rcv_boom_angle_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,94,temp_str)

	temp_ind = Range_to_bit(temp_int, 30,4500) --에러
	set_value(Current_screen,20,temp_ind)

	temp_int = CombineToSigned16_dec(Rcv_boom_angle[1], Rcv_boom_angle[2]) -- 환산치
	--temp_int = temp_int-360
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,95,temp_str)


	--- 붐인출1
	temp_int = CombineToSigned16_dec(Rcv_boom1_dist_adc[1], Rcv_boom1_dist_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,102,temp_str)

	temp_ind = Range_to_bit(temp_int, 160,4000) --에러
	set_value(Current_screen,21,temp_ind)

	temp_float = CombineToSigned16_f100(Rcv_boom1_out_lenght[1], Rcv_boom1_out_lenght[2]) -- 환산치
	temp_str = string.format("%.2f", temp_float)
	set_text(Current_screen,103,temp_str)

	--- 붐인출2
	temp_int = CombineToSigned16_dec(Rcv_boom2_out_adc[1], Rcv_boom2_out_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,106,temp_str)

	temp_ind = Range_to_bit(temp_int, 80,5000) --에러
	set_value(Current_screen,22,temp_ind)

	temp_float = CombineToSigned16_f100(Rcv_boom2_out_lenght[1], Rcv_boom2_out_lenght[2]) -- 환산치
	temp_str = string.format("%.2f", temp_float)
	set_text(Current_screen,107,temp_str)


	--- 틸팅 탑승함
	temp_int = CombineToSigned16_dec(Rcv_seat_tilt_adc[1], Rcv_seat_tilt_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,110,temp_str)

	temp_ind = Range_to_bit(temp_int, 30,4500) --에러
	set_value(Current_screen,23,temp_ind)

	temp_int = CombineToSigned16_dec(Rcv_seat_tilt[1], Rcv_seat_tilt[2]) -- 환산치
	--temp_int = temp_int-360
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,111,temp_str)	

	--- 풍속계
	temp_int = CombineToSigned16_dec(Rcv_wind_adc[1], Rcv_wind_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,114,temp_str)

	temp_ind = Range_to_bit(temp_int, 300,4700) --에러
	set_value(Current_screen,24,temp_ind)

	temp_int = CombineToSigned16_dec(Rcv_wind[1], Rcv_wind[2]) -- 환산치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,115,temp_str)	


	--- OR-FL
	temp_int = CombineToSigned16_dec(Rcv_otg_rate_fl_adc[1], Rcv_otg_rate_fl_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,126,temp_str)

	temp_ind = Range_to_bit(temp_int, 200,4500) --에러
	set_value(Current_screen,27,temp_ind)

	temp_str = string.format("%d", Rcv_otg_rate_fl)
	set_text(Current_screen,127,temp_str)	

	--- OR-FR
	temp_int = CombineToSigned16_dec(Rcv_otg_rate_fr_adc[1], Rcv_otg_rate_fr_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,130,temp_str)

	temp_ind = Range_to_bit(temp_int, 200,4500) --에러
	set_value(Current_screen,28,temp_ind)

	temp_str = string.format("%d", Rcv_otg_rate_fr)
	set_text(Current_screen,131,temp_str)	


	--- OR-RL
	temp_int = CombineToSigned16_dec(Rcv_otg_rate_rl_adc[1], Rcv_otg_rate_rl_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,134,temp_str)

	temp_ind = Range_to_bit(temp_int, 200,4500) --에러
	set_value(Current_screen,29,temp_ind)

	temp_str = string.format("%d", Rcv_otg_rate_rl)
	set_text(Current_screen,135,temp_str)	


	--- OR-RR
	temp_int = CombineToSigned16_dec(Rcv_otg_rate_rr_adc[1], Rcv_otg_rate_rr_adc[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,138,temp_str)

	temp_ind = Range_to_bit(temp_int, 200,4500) --에러
	set_value(Current_screen,30,temp_ind)

	temp_str = string.format("%d", Rcv_otg_rate_rr)
	set_text(Current_screen,139,temp_str)	


	temp_int = Bit_mask_bit_n(Rcv_io_ind[3], BIT0) --써밍 통신
	set_value(Current_screen,31,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[3], BIT1) --하부 통신
	set_value(Current_screen,32,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[3], BIT2) --aml 통신
	set_value(Current_screen,33,temp_int)

	temp_int = Bit_mask_bit_n(Rcv_io_ind[3], BIT3) --rmt 통신
	set_value(Current_screen,34,temp_int)


end
local disp_cnt = 0
function Rmt_axis_init_process()
	
	local temp_str = " "
	local temp_int = 0

	set_visiable(Current_screen,34,0)
	Help_show = 0

	temp_str = string.format("%d", Rcv_rmt_dir1) --바스켓선회
	set_text(Current_screen,19,temp_str)	

	temp_str = string.format("%d", Rcv_rmt_dir2) --선회
	set_text(Current_screen,13,temp_str)	

	temp_str = string.format("%d", Rcv_rmt_dir3) --데릭
	set_text(Current_screen,16,temp_str)	

	temp_str = string.format("%d", Rcv_rmt_dir4) --텔레
	set_text(Current_screen,21,temp_str)	

	set_visiable(Current_screen,28,0)


end

function Rmt_axis_process() ---  리모콘 방향
	local temp_int = 0
	local temp_str = " "
	local correct_check = 0

	--temp_int = ToSigned8Bit(Rcv_rmt_deric)
	temp_str = string.format("%d", Rcv_rmt_deric) --데릭
	set_text(Current_screen,33,temp_str)	

	--temp_int = ToSigned8Bit(Rcv_rmt_shirnk)
	temp_str = string.format("%d", Rcv_rmt_shirnk) --텔레
	set_text(Current_screen,31,temp_str)	

	--temp_int = ToSigned8Bit()
	temp_str = string.format("%d", Rcv_rmt_rotate) --선회
	set_text(Current_screen,29,temp_str)	

	--temp_int = ToSigned8Bit(Rcv_rmt_bucket)
	
	temp_str = string.format("%d", Rcv_rmt_bucket) --바스켓
	set_text(Current_screen,27,temp_str)	

 --- rmt valve out add 250205

 	temp_int = CombineToSigned16_dec(Rcv_pve_deric[1], Rcv_pve_deric[2]) -- pve deric
    temp_str = string.format("%d", temp_int) --데릭
	set_text(Current_screen,39,temp_str)	

	
	temp_int = CombineToSigned16_dec(Rcv_pve_boom[1], Rcv_pve_boom[2]) 
	temp_str = string.format("%d", temp_int) -- 텔레
	set_text(Current_screen,40,temp_str)	

	
	temp_int = CombineToSigned16_dec(Rcv_pve_boom2[1], Rcv_pve_boom2[2])   -- pve boom2
	temp_str = string.format("%d", temp_int) -- 텔레2
	set_text(Current_screen,55,temp_str)	

	temp_int = CombineToSigned16_dec(Rcv_pve_rotate[1], Rcv_pve_rotate[2])
	temp_str = string.format("%d", temp_int) -- 선회
	set_text(Current_screen,38,temp_str)	

	temp_int = CombineToSigned16_dec(Rcv_pve_seat[1], Rcv_pve_seat[2])
	temp_str = string.format("%d", Rcv_rmt_bucket) -- 바스켓켓
	set_text(Current_screen,37,temp_int)	


	temp_int = Bit_mask_bit(Rcv_io_ind[3], BIT5) -- 리모콘 모드
	set_value(Current_screen,49,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT5) -- 리모콘 대기기
	set_value(Current_screen,43,temp_int)

	





	if Rmt_axis_set_flag == 1 then	
	   if Tx_can_mode_and_rmt[0] ~= Rcv_rmt_dir1 then  correct_check = 1 end
	   if Tx_can_mode_and_rmt[1] ~= Rcv_rmt_dir2 then  correct_check = 1 end
	   if Tx_can_mode_and_rmt[2] ~= Rcv_rmt_dir3 then  correct_check = 1 end
	   if Tx_can_mode_and_rmt[3] ~= Rcv_rmt_dir4 then  correct_check = 1 end

	   if correct_check == 0 then Rmt_axis_set_flag = 0 
		Tx_can_mode_and_rmt[5] = 0
		Rmt_axis_init_process() end

	end
end



function Diago4_process()

	local temp_int = 0
	local temp_str = " "
	
	if Alam_cnt>0 then
		MSG_color_cnt = MSG_color_cnt+1
		if MSG_color_cnt  == 5 then 
			set_fore_color(Current_screen,200,Title_Blue)
		end
		if MSG_color_cnt  == 10 then 
			set_fore_color(Current_screen,200,RED)
			MSG_color_cnt = 0
		end
	end 


----- input


	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT0) -- 회전원점
	set_value(Current_screen,2,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT1) -- 회전1
	set_value(Current_screen,5,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT2) -- 회전2
	set_value(Current_screen,6,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT7) -- 길이원점
	set_value(Current_screen,12,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[3], BIT5) -- 리모콘 모드
	set_value(Current_screen,23,temp_int)




	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT0) -- fl
	set_value(Current_screen,29,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT1) -- fr
	set_value(Current_screen,31,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT2) --rl
	set_value(Current_screen,32,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT3) --rr
	set_value(Current_screen,33,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT4) --격납센서
	set_value(Current_screen,20,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[1], BIT5) --자동/수동
	set_value(Current_screen,22,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT2) --PVDI 붐1 인출
	set_value(Current_screen,39,temp_int)
	
	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT3) --PVDI 붐1 인입
	set_value(Current_screen,41,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT4) --PVDI 붐2 인출
	set_value(Current_screen,42,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT5) --PVDI 붐2 인입
	set_value(Current_screen,43,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT6) --PVDI 회전+
	set_value(Current_screen,59,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT7) --PVDI 회전 -
	set_value(Current_screen,63,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT0) --PVDI 데릭상승
	set_value(Current_screen,64,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[0], BIT1) --PVDI 데릭하강
	set_value(Current_screen,65,temp_int)
--- out put

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT5) -- EST
	set_value(Current_screen,69,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[2], BIT6) -- ESP
	set_value(Current_screen,71,temp_int)
	
	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT6) -- RPM+
	set_value(Current_screen,72,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT7) -- RPM-
	set_value(Current_screen,73,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT2) -- 녹색경광등
	set_value(Current_screen,77,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT0) -- 적색 경광등
	set_value(Current_screen,79,temp_int)
	
	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT1) -- 황색 경광등
	set_value(Current_screen,80,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT3) -- 혼
	set_value(Current_screen,81,temp_int)
 

	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT5) -- 3WAY SOL
	set_value(Current_screen,85,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT4) --상부 언로딩
	set_value(Current_screen,87,temp_int)
	
	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT6) -- 싸이렌
	set_value(Current_screen,88,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT3) -- 부져
	set_value(Current_screen,89,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[4], BIT5) -- 메인 언로딩
	set_value(Current_screen,93,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT0) -- 수동거리
	set_value(Current_screen,95,temp_int)
	
	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT1) -- 수동(회전+)
	set_value(Current_screen,96,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[5], BIT2) -- 수동 회전(-)
	set_value(Current_screen,34,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT0) -- PVG SOL1
	set_value(Current_screen,107,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT1) -- PVG SOL2
	set_value(Current_screen,110,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT2) -- PVG SOL3
	set_value(Current_screen,113,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT3) -- 데릭 출력
	set_value(Current_screen,116,temp_int)


	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT4) -- 붐1 출력
	set_value(Current_screen,106,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT5) -- 붐2 출력
	set_value(Current_screen,109,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT6) -- 붐선회 출력
	set_value(Current_screen,112,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[6], BIT7) -- 바스켓 선회 출력
	set_value(Current_screen,115,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[7], BIT1) -- 틸팅 상승 출력
	set_value(Current_screen,105,temp_int)

	temp_int = Bit_mask_bit(Rcv_io_ind[7], BIT2) -- 틸팅 하강 출력
	set_value(Current_screen,108,temp_int)


end


function Out_rabbit_init_process()
	Current_mdoe = Rabbit
	Tx_can_mode_and_rmt[4] = Rabbit
	
	Rabbit_out_change_flag = 0
	Tuttle_out_change_flag = 0
	Rabbit_lamp_change_flag = 0
	Rabbit_lamp_change_flag = 0
	
	Rabbit_out_save_flag = 0
	Tuttle_out_save_flag = 0
	Rabbit_lamp_save_flag = 0
	Rabbit_lamp_save_flag = 0
	
	Rabbit_out_send_flag = 0
	Tuttle_out_send_flag = 0
	Rabbit_lamp_send_flag = 0
	Rabbit_lamp_send_flag = 0

	Tx_can_rmt_para[4] = 0
	Tx_can_rmt_para[5] = 0
	Tx_can_mode_and_rmt[0] = Rcv_rmt_dir1
	Tx_can_mode_and_rmt[1] = Rcv_rmt_dir2
	Tx_can_mode_and_rmt[2] = Rcv_rmt_dir3
	Tx_can_mode_and_rmt[3] = Rcv_rmt_dir4

	set_visiable(Current_screen,39,0)
	set_visiable(Current_screen,35,0) 
	Help_show = 0

end

function Lamp_rabbit_init_process()
	Current_mdoe = Rabbit
	Tx_can_mode_and_rmt[4] = Rabbit

	Rabbit_out_change_flag = 0
	Tuttle_out_change_flag = 0
	Rabbit_lamp_change_flag = 0
	Rabbit_lamp_change_flag = 0

	Rabbit_out_save_flag = 0
	Tuttle_out_save_flag = 0
	Rabbit_lamp_save_flag = 0
	Rabbit_lamp_save_flag = 0

	Rabbit_out_send_flag = 0
	Tuttle_out_send_flag = 0
	Rabbit_lamp_send_flag = 0
	Rabbit_lamp_send_flag = 0

	Tx_can_rmt_para[4] = 0
	Tx_can_rmt_para[5] = 0

	set_visiable(Current_screen,21,0)
	set_visiable(Current_screen,35,0) 
	Help_show = 0

end

function Out_tuttle_init_process()
	
	Current_mdoe = Tuttle
	Tx_can_mode_and_rmt[4] = Tuttle

	Rabbit_out_change_flag = 0
	Tuttle_out_change_flag = 0
	Rabbit_lamp_change_flag = 0
	Rabbit_lamp_change_flag = 0

	Rabbit_out_save_flag = 0
	Tuttle_out_save_flag = 0
	Rabbit_lamp_save_flag = 0
	Rabbit_lamp_save_flag = 0

	Rabbit_out_send_flag = 0
	Tuttle_out_send_flag = 0
	Rabbit_lamp_send_flag = 0
	Rabbit_lamp_send_flag = 0


	Tx_can_rmt_para[4] = 0
	Tx_can_rmt_para[5] = 0

	set_visiable(Current_screen,27,0)
	set_visiable(Current_screen,35,0) 
	Help_show = 0


end

function Lamp_tuttle_init_process()
	
	Current_mdoe = Tuttle
	Tx_can_mode_and_rmt[4] = Tuttle


	Rabbit_out_change_flag = 0
	Tuttle_out_change_flag = 0

	Rabbit_lamp_change_flag = 0
	Rabbit_lamp_change_flag = 0

	Rabbit_out_save_flag = 0
	Tuttle_out_save_flag = 0


	Rabbit_lamp_save_flag = 0
	Rabbit_lamp_save_flag = 0

	Rabbit_out_send_flag = 0
	Tuttle_out_send_flag = 0


	Rabbit_lamp_send_flag = 0
	Rabbit_lamp_send_flag = 0

	Tx_can_rmt_para[4] = 0
	Tx_can_rmt_para[5] = 0

	set_visiable(Current_screen,28,0)
	set_visiable(Current_screen,35,0) 
	Help_show = 0


end




function Out_rabbit_disp_process()
	
	local temp_int = 0
	local temp_str = " "
	--local judge = false
	

	
	temp_int = CombineToSigned16_dec(Rcv_pve_deric[1], Rcv_pve_deric[2]) -- pve deric
	set_value(Current_screen, 49, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,82,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_pve_boom2[1], Rcv_pve_boom2[2])   -- pve boom2
	set_value(Current_screen, 59, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,87,temp_str)


	temp_int = CombineToSigned16_dec(Rcv_pve_rotate[1], Rcv_pve_rotate[2]) -- pve roatate
	set_value(Current_screen, 66, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,89,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_pve_seat[1], Rcv_pve_seat[2]) -- pve seat
	set_value(Current_screen, 71, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,90,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_pve_boom[1], Rcv_pve_boom[2])   -- pve boom1
	set_value(Current_screen, 76, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,93,temp_str)



	if Rabbit_out_change_flag == 0 then --- normal state

		if(Out_rabbit_first_check == 0) then

			OR_Rcv_deric_out_pos_start[1] = Rcv_deric_out_pos_start[1]
			OR_Rcv_deric_out_pos_start[2] = Rcv_deric_out_pos_start[2]

			OR_Rcv_deric_out_pos_stop[1] = Rcv_deric_out_pos_stop[1]
			OR_Rcv_deric_out_pos_stop[2] = Rcv_deric_out_pos_stop[2]


			OR_Rcv_deric_out_neg_start[1] = Rcv_deric_out_neg_start[1]
			OR_Rcv_deric_out_neg_start[2] = Rcv_deric_out_neg_start[2]

			OR_Rcv_deric_out_neg_stop[1] = Rcv_deric_out_neg_stop[1]
			OR_Rcv_deric_out_neg_stop[2] = Rcv_deric_out_neg_stop[2]
			
			--id 1109
			OR_Rcv_boom1_out_pos_start[1] = Rcv_boom1_out_pos_start[1]
			OR_Rcv_boom1_out_pos_start[2] = Rcv_boom1_out_pos_start[2]


			OR_Rcv_boom1_out_pos_stop[1] = Rcv_boom1_out_pos_stop[1]
			OR_Rcv_boom1_out_pos_stop[2] = Rcv_boom1_out_pos_stop[2]

			OR_Rcv_boom1_out_neg_start[1] = Rcv_boom1_out_neg_start[1]
			OR_Rcv_boom1_out_neg_start[2] = Rcv_boom1_out_neg_start[2]

			OR_Rcv_boom1_out_neg_stop[1] = Rcv_boom1_out_neg_stop[1]
			OR_Rcv_boom1_out_neg_stop[2] = Rcv_boom1_out_neg_stop[2]
			
			--id 1110

			OR_Rcv_rotate_out_pos_start[1] = Rcv_rotate_out_pos_start[1]
			OR_Rcv_rotate_out_pos_start[2] = Rcv_rotate_out_pos_start[2]

			OR_Rcv_rotate_out_pos_stop[1] = Rcv_rotate_out_pos_stop[1]
			OR_Rcv_rotate_out_pos_stop[2] = Rcv_rotate_out_pos_stop[2]

			OR_Rcv_rotate_out_neg_start[1] = Rcv_rotate_out_neg_start[1]
			OR_Rcv_rotate_out_neg_start[2] =Rcv_rotate_out_neg_start[2]

			OR_Rcv_rotate_out_neg_stop[1] = Rcv_rotate_out_neg_stop[1]
			OR_Rcv_rotate_out_neg_stop[2] = Rcv_rotate_out_neg_stop[2]
			
			--id 1111
			OR_Rcv_seat_out_pos_start[1] = Rcv_seat_out_pos_start[1]
			OR_Rcv_seat_out_pos_start[2] = Rcv_seat_out_pos_start[2]

			OR_Rcv_seat_out_pos_stop[1] = Rcv_seat_out_pos_stop[1]
			OR_Rcv_seat_out_pos_stop[2] = Rcv_seat_out_pos_stop[2]

			OR_Rcv_seat_out_neg_start[1] = Rcv_seat_out_neg_start[1]
			OR_Rcv_seat_out_neg_start[2] = Rcv_seat_out_neg_start[2]

			OR_Rcv_seat_out_neg_stop[1] = Rcv_seat_out_neg_stop[1]
			OR_Rcv_seat_out_neg_stop[2] = Rcv_seat_out_neg_stop[2]

			
			
			OR_Rcv_boom2_out_pos_start[1] = Rcv_boom2_out_pos_start[1]
			OR_Rcv_boom2_out_pos_start[2] = Rcv_boom2_out_pos_start[2]

			OR_Rcv_boom2_out_pos_stop[1] = Rcv_boom2_out_pos_stop[1]
			OR_Rcv_boom2_out_pos_stop[2] = Rcv_boom2_out_pos_stop[2]

			OR_Rcv_boom2_out_neg_start[1] = Rcv_boom2_out_neg_start[1]
			OR_Rcv_boom2_out_neg_start[2] = Rcv_boom2_out_neg_start[2]

			OR_Rcv_boom2_out_neg_stop[1] = Rcv_boom2_out_neg_stop[1]
			OR_Rcv_boom2_out_neg_stop[2] = Rcv_boom2_out_neg_stop[2]



			Out_rabbit_first_check = 1
	
		end
	

    	temp_int = CombineToSigned16_dec(Rcv_deric_out_pos_stop[1], Rcv_deric_out_pos_stop[2]) -- 데릭 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,23,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_pos_start[1], Rcv_deric_out_pos_start[2]) -- 데릭 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,19,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_neg_start[1], Rcv_deric_out_neg_start[2]) -- 데릭 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,21,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_neg_stop[1], Rcv_deric_out_neg_stop[2]) -- 데릭 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,24,temp_str)

		---- 붐2
		temp_int = CombineToSigned16_dec(Rcv_boom2_out_pos_stop[1], Rcv_boom2_out_pos_stop[2]) -- 붐2 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,30,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_pos_start[1], Rcv_boom2_out_pos_start[2]) -- 붐2 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,31,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_neg_start[1], Rcv_boom2_out_neg_start[2]) -- 붐2 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,33,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_neg_stop[1], Rcv_boom2_out_neg_stop[2]) -- 붐2 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,34,temp_str)


		---- 회전
		temp_int = CombineToSigned16_dec(Rcv_rotate_out_pos_stop[1], Rcv_rotate_out_pos_stop[2]) -- 회전 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,42,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_pos_start[1], Rcv_rotate_out_pos_start[2]) -- 회전 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,43,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_neg_start[1], Rcv_rotate_out_neg_start[2]) -- 회전 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,55,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_neg_stop[1], Rcv_rotate_out_neg_stop[2]) -- 회전 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,56,temp_str)

		---- 탑승함 회전
		temp_int = CombineToSigned16_dec(Rcv_seat_out_pos_stop[1], Rcv_seat_out_pos_stop[2]) -- 탑승함회전 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,64,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_seat_out_pos_start[1], Rcv_seat_out_pos_start[2]) -- 탑승함회전 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,65,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_seat_out_neg_start[1], Rcv_seat_out_neg_start[2]) --탑승함 회전 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,67,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_seat_out_neg_stop[1], Rcv_seat_out_neg_stop[2]) --탑승함 회전 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,68,temp_str)


		---- 붐1
		temp_int = CombineToSigned16_dec(Rcv_boom1_out_pos_stop[1], Rcv_boom1_out_pos_stop[2]) -- 붐2 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,74,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_pos_start[1], Rcv_boom1_out_pos_start[2]) -- 붐2 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,75,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_neg_start[1], Rcv_boom1_out_neg_start[2]) -- 붐2 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,77,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_neg_stop[1], Rcv_boom1_out_neg_stop[2]) -- 붐2 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,78,temp_str)
	end	


end

Out_tuttle_cnt = 0
function Out_tuttle_disp_process()

	local temp_int = 0
	local temp_str = " "
	--local judge = false


	temp_int = CombineToSigned16_dec(Rcv_pve_deric[1], Rcv_pve_deric[2]) -- pve deric
	set_value(Current_screen, 49, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,87,temp_str)


	temp_int = CombineToSigned16_dec(Rcv_pve_boom2[1], Rcv_pve_boom2[2])   -- pve boom2
	set_value(Current_screen, 59, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,89,temp_str)


	temp_int = CombineToSigned16_dec(Rcv_pve_rotate[1], Rcv_pve_rotate[2]) -- pve roatate
	set_value(Current_screen, 66, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,90,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_pve_seat[1], Rcv_pve_seat[2]) -- pve seat
	set_value(Current_screen, 71, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,92,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_pve_boom[1], Rcv_pve_boom[2])   -- pve boom1
	set_value(Current_screen, 76, temp_int)
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,94,temp_str)



	if Tuttle_out_change_flag == 0 then
		--데릭
		if(Out_tuttle_first_check == 0) then

			OT_Rcv_deric_out_pos_start[1] = Rcv_deric_out_pos_start[1]
			OT_Rcv_deric_out_pos_start[2] = Rcv_deric_out_pos_start[2]

			OT_Rcv_deric_out_pos_stop[1] = Rcv_deric_out_pos_stop[1]
			OT_Rcv_deric_out_pos_stop[2] = Rcv_deric_out_pos_stop[2]


			OT_Rcv_deric_out_neg_start[1] = Rcv_deric_out_neg_start[1]
			OT_Rcv_deric_out_neg_start[2] = Rcv_deric_out_neg_start[2]

			OT_Rcv_deric_out_neg_stop[1] = Rcv_deric_out_neg_stop[1]
			OT_Rcv_deric_out_neg_stop[2] = Rcv_deric_out_neg_stop[2]
			
			--id 1109
			OT_Rcv_boom1_out_pos_start[1] = Rcv_boom1_out_pos_start[1]
			OT_Rcv_boom1_out_pos_start[2] = Rcv_boom1_out_pos_start[2]


			OT_Rcv_boom1_out_pos_stop[1] = Rcv_boom1_out_pos_stop[1]
			OT_Rcv_boom1_out_pos_stop[2] = Rcv_boom1_out_pos_stop[2]

			OT_Rcv_boom1_out_neg_start[1] = Rcv_boom1_out_neg_start[1]
			OT_Rcv_boom1_out_neg_start[2] = Rcv_boom1_out_neg_start[2]

			OT_Rcv_boom1_out_neg_stop[1] = Rcv_boom1_out_neg_stop[1]
			OT_Rcv_boom1_out_neg_stop[2] = Rcv_boom1_out_neg_stop[2]
			
			--id 1110

			OT_Rcv_rotate_out_pos_start[1] = Rcv_rotate_out_pos_start[1]
			OT_Rcv_rotate_out_pos_start[2] = Rcv_rotate_out_pos_start[2]

			OT_Rcv_rotate_out_pos_stop[1] = Rcv_rotate_out_pos_stop[1]
			OT_Rcv_rotate_out_pos_stop[2] = Rcv_rotate_out_pos_stop[2]

			OT_Rcv_rotate_out_neg_start[1] = Rcv_rotate_out_neg_start[1]
			OT_Rcv_rotate_out_neg_start[2] =Rcv_rotate_out_neg_start[2]

			OT_Rcv_rotate_out_neg_stop[1] = Rcv_rotate_out_neg_stop[1]
			OT_Rcv_rotate_out_neg_stop[2] = Rcv_rotate_out_neg_stop[2]
			
			--id 1111
			OT_Rcv_seat_out_pos_start[1] = Rcv_seat_out_pos_start[1]
			OT_Rcv_seat_out_pos_start[2] = Rcv_seat_out_pos_start[2]

			OT_Rcv_seat_out_pos_stop[1] = Rcv_seat_out_pos_stop[1]
			OT_Rcv_seat_out_pos_stop[2] = Rcv_seat_out_pos_stop[2]

			OT_Rcv_seat_out_neg_start[1] = Rcv_seat_out_neg_start[1]
			OT_Rcv_seat_out_neg_start[2] = Rcv_seat_out_neg_start[2]

			OT_Rcv_seat_out_neg_stop[1] = Rcv_seat_out_neg_stop[1]
			OT_Rcv_seat_out_neg_stop[2] = Rcv_seat_out_neg_stop[2]

			
			
			OT_Rcv_boom2_out_pos_start[1] = Rcv_boom2_out_pos_start[1]
			OT_Rcv_boom2_out_pos_start[2] = Rcv_boom2_out_pos_start[2]

			OT_Rcv_boom2_out_pos_stop[1] = Rcv_boom2_out_pos_stop[1]
			OT_Rcv_boom2_out_pos_stop[2] = Rcv_boom2_out_pos_stop[2]

			OT_Rcv_boom2_out_neg_start[1] = Rcv_boom2_out_neg_start[1]
			OT_Rcv_boom2_out_neg_start[2] = Rcv_boom2_out_neg_start[2]

			OT_Rcv_boom2_out_neg_stop[1] = Rcv_boom2_out_neg_stop[1]
			OT_Rcv_boom2_out_neg_stop[2] = Rcv_boom2_out_neg_stop[2]


			
			Out_tuttle_first_check = 1
	
		end
	

		temp_int = CombineToSigned16_dec(Rcv_deric_out_pos_stop[1], Rcv_deric_out_pos_stop[2]) -- 데릭 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,23,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_pos_start[1], Rcv_deric_out_pos_start[2]) -- 데릭 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,19,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_neg_start[1], Rcv_deric_out_neg_start[2]) -- 데릭 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,21,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_deric_out_neg_stop[1], Rcv_deric_out_neg_stop[2]) -- 데릭 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,24,temp_str)

		---- 붐2
		temp_int = CombineToSigned16_dec(Rcv_boom2_out_pos_stop[1], Rcv_boom2_out_pos_stop[2]) -- 붐2 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,30,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_pos_start[1], Rcv_boom2_out_pos_start[2]) -- 붐2 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,31,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_neg_start[1], Rcv_boom2_out_neg_start[2]) -- 붐2 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,33,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_boom2_out_neg_stop[1], Rcv_boom2_out_neg_stop[2]) -- 붐2 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,34,temp_str)

		---- 회전
		temp_int = CombineToSigned16_dec(Rcv_rotate_out_pos_stop[1], Rcv_rotate_out_pos_stop[2]) -- 회전 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,42,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_pos_start[1], Rcv_rotate_out_pos_start[2]) -- 회전 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,43,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_neg_start[1], Rcv_rotate_out_neg_start[2]) -- 회전 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,55,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_rotate_out_neg_stop[1], Rcv_rotate_out_neg_stop[2]) -- 회전 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,56,temp_str)

		---- 탑승함 회전
		temp_int = CombineToSigned16_dec(Rcv_seat_out_pos_stop[1], Rcv_seat_out_pos_stop[2]) -- 탑승함회전 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,64,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_seat_out_pos_start[1], Rcv_seat_out_pos_start[2]) -- 탑승함회전 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,65,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_seat_out_neg_start[1], Rcv_seat_out_neg_start[2]) --탑승함 회전 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,67,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_seat_out_neg_stop[1], Rcv_seat_out_neg_stop[2]) --탑승함 회전 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,68,temp_str)


		---- 붐1
		temp_int = CombineToSigned16_dec(Rcv_boom1_out_pos_stop[1], Rcv_boom1_out_pos_stop[2]) -- 붐2 상승 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,74,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_pos_start[1], Rcv_boom1_out_pos_start[2]) -- 붐2 상승 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,75,temp_str)

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_neg_start[1], Rcv_boom1_out_neg_start[2]) -- 붐2 하강 시작
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,77,temp_str)	

		temp_int = CombineToSigned16_dec(Rcv_boom1_out_neg_stop[1], Rcv_boom1_out_neg_stop[2]) -- 붐2 하강 최대 출력
		temp_str = string.format("%d", temp_int)
		set_text(Current_screen,78,temp_str)
	end
end


function Lamp_rabbit_disp_process()
	local temp_str = " "
	local temp_int = 0


	
	
	if Rabbit_lamp_change_flag == 0 then

		if(Lamp_rabbit_first_check == 0) then
		
			OR_Rcv_deric_lamp_pos_start = Rcv_deric_lamp_pos_start
			OR_Rcv_deric_lamp_pos_stop = Rcv_deric_lamp_pos_stop
			OR_Rcv_deric_lamp_neg_start = Rcv_deric_lamp_neg_start
			OR_Rcv_deric_lamp_neg_stop = Rcv_deric_lamp_neg_stop
			OR_Rcv_boom1_lamp_pos_start = Rcv_boom1_lamp_pos_start
			OR_Rcv_boom1_lamp_pos_stop = Rcv_boom1_lamp_pos_stop
			OR_Rcv_boom1_lamp_neg_start = Rcv_boom1_lamp_neg_start
			OR_Rcv_boom1_lamp_neg_stop = Rcv_boom1_lamp_neg_stop
			
			OR_Rcv_rotate_lamp_pos_start = Rcv_rotate_lamp_pos_start
			OR_Rcv_rotate_lamp_pos_stop = Rcv_rotate_lamp_pos_stop
			OR_Rcv_rotate_lamp_neg_start = Rcv_rotate_lamp_neg_start
			OR_Rcv_rotate_lamp_neg_stop = Rcv_rotate_lamp_neg_stop
			OR_Rcv_seat_lamp_pos_start = Rcv_seat_lamp_pos_start
			OR_Rcv_seat_lamp_pos_stop = Rcv_seat_lamp_pos_stop
			OR_Rcv_seat_lamp_neg_start = Rcv_seat_lamp_neg_start
			OR_Rcv_seat_lamp_neg_stop = Rcv_seat_lamp_neg_stop
			
			OR_Rcv_boom2_lamp_pos_start = Rcv_boom2_lamp_pos_start
			OR_Rcv_boom2_lamp_pos_stop = Rcv_boom2_lamp_pos_stop
			OR_Rcv_boom2_lamp_neg_start =Rcv_boom2_lamp_neg_start
			OR_Rcv_boom2_lamp_neg_stop = Rcv_boom2_lamp_neg_stop
			Lamp_rabbit_first_check = 1 
	
		end
	
	
		
		
		--temp_int = ToSigned8Bit(Rcv_deric_lamp_pos_start)
		temp_str = string.format("%d", Rcv_deric_lamp_pos_start)
		set_text(Current_screen,23,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_deric_lamp_pos_stop)
		set_text(Current_screen,19,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_neg_start)
		temp_str = string.format("%d", Rcv_deric_lamp_neg_start)
		set_text(Current_screen,20,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_deric_lamp_neg_stop)
		set_text(Current_screen,24,temp_str)


		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_pos_start)   -- 붐2
		temp_str = string.format("%d", Rcv_boom2_lamp_pos_start)
		set_text(Current_screen,30,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_boom2_lamp_pos_stop)
		set_text(Current_screen,31,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_neg_start)
		temp_str = string.format("%d", Rcv_boom2_lamp_neg_start)
		set_text(Current_screen,32,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_boom2_lamp_neg_stop)
		set_text(Current_screen,34,temp_str)


		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_pos_start)
		temp_str = string.format("%d", Rcv_rotate_lamp_pos_start)
		set_text(Current_screen,42,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_rotate_lamp_pos_stop)
		set_text(Current_screen,43,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_neg_start)
		temp_str = string.format("%d", Rcv_rotate_lamp_neg_start)
		set_text(Current_screen,49,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_rotate_lamp_neg_stop)
		set_text(Current_screen,56,temp_str)


		--temp_int = ToSigned8Bit(Rcv_seat_lamp_pos_start)
		temp_str = string.format("%d", Rcv_seat_lamp_pos_start)
		set_text(Current_screen,64,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_seat_lamp_pos_stop)
		set_text(Current_screen,65,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_neg_start)
		temp_str = string.format("%d", Rcv_seat_lamp_neg_start)
		set_text(Current_screen,66,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_seat_lamp_neg_stop)
		set_text(Current_screen,68,temp_str)

		
		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_pos_start) -- 붐1
		temp_str = string.format("%d", Rcv_boom1_lamp_pos_start)
		set_text(Current_screen,74,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_boom1_lamp_pos_stop)
		set_text(Current_screen,75,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_neg_start)
		temp_str = string.format("%d", Rcv_boom1_lamp_neg_start)
		set_text(Current_screen,76,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_boom1_lamp_neg_stop)
		set_text(Current_screen,78,temp_str)
	end

	if Rabbit_lamp_send_flag == 1 then
		
		Lamp_rabbit_rx_arry[1] = ToSigned8Bit(Rcv_deric_lamp_pos_start)
		Lamp_rabbit_rx_arry[2] = ToSigned8Bit(Rcv_deric_lamp_pos_stop)
		Lamp_rabbit_rx_arry[3] = ToSigned8Bit(Rcv_deric_lamp_neg_start)
		Lamp_rabbit_rx_arry[4] = ToSigned8Bit(Rcv_deric_lamp_neg_stop)


		Lamp_rabbit_rx_arry[5] = ToSigned8Bit(Rcv_boom2_lamp_pos_start)
		Lamp_rabbit_rx_arry[6] = ToSigned8Bit(Rcv_boom2_lamp_pos_stop)
		Lamp_rabbit_rx_arry[7] = ToSigned8Bit(Rcv_boom2_lamp_neg_start)
		Lamp_rabbit_rx_arry[8] = ToSigned8Bit(Rcv_boom2_lamp_neg_stop)


		Lamp_rabbit_rx_arry[9] = ToSigned8Bit(Rcv_rotate_lamp_pos_start)
		Lamp_rabbit_rx_arry[10] = ToSigned8Bit(Rcv_rotate_lamp_pos_stop)
		Lamp_rabbit_rx_arry[11] = ToSigned8Bit(Rcv_rotate_lamp_neg_start)
		Lamp_rabbit_rx_arry[12] = ToSigned8Bit(Rcv_rotate_lamp_neg_stop)


		Lamp_rabbit_rx_arry[13] = ToSigned8Bit(Rcv_seat_lamp_pos_start)
		Lamp_rabbit_rx_arry[14] = ToSigned8Bit(Rcv_seat_lamp_pos_stop)
		Lamp_rabbit_rx_arry[15] = ToSigned8Bit(Rcv_seat_lamp_neg_start)
		Lamp_rabbit_rx_arry[16] = ToSigned8Bit(Rcv_seat_lamp_neg_stop)

		
		Lamp_rabbit_rx_arry[17] = ToSigned8Bit(Rcv_boom1_lamp_pos_start)
		Lamp_rabbit_rx_arry[18] = ToSigned8Bit(Rcv_boom1_lamp_pos_stop)
		Lamp_rabbit_rx_arry[19] = ToSigned8Bit(Rcv_boom1_lamp_neg_start)
		Lamp_rabbit_rx_arry[20] = ToSigned8Bit(Rcv_boom1_lamp_neg_stop)
		
		Judge = CompareTables(Lamp_rabbit_rx_arry, Lamp_rabbit_tx_arry)
		if Judge == true then 
			Rabbit_lamp_change_flag = 0
			Rabbit_lamp_send_flag = 0
			Rabbit_lamp_save_flag = 0
			Tx_can_rmt_para[4] = 0
			Tx_can_rmt_para[5] = 0
			set_visiable(Current_screen,21,0)
		end
	end
end



function Lamp_tuttle_disp_process()
	local temp_str = " "
	local temp_int = 0

	if Tuttle_lamp_change_flag == 0 then

		if(Lamp_tuttle_first_check == 0) then
		
			OT_Rcv_deric_lamp_pos_start = Rcv_deric_lamp_pos_start
			OT_Rcv_deric_lamp_pos_stop = Rcv_deric_lamp_pos_stop
			OT_Rcv_deric_lamp_neg_start = Rcv_deric_lamp_neg_start
			OT_Rcv_deric_lamp_neg_stop = Rcv_deric_lamp_neg_stop
			OT_Rcv_boom1_lamp_pos_start = Rcv_boom1_lamp_pos_start
			OT_Rcv_boom1_lamp_pos_stop = Rcv_boom1_lamp_pos_stop
			OT_Rcv_boom1_lamp_neg_start = Rcv_boom1_lamp_neg_start
			OT_Rcv_boom1_lamp_neg_stop = Rcv_boom1_lamp_neg_stop
			
			OT_Rcv_rotate_lamp_pos_start = Rcv_rotate_lamp_pos_start
			OT_Rcv_rotate_lamp_pos_stop = Rcv_rotate_lamp_pos_stop
			OT_Rcv_rotate_lamp_neg_start = Rcv_rotate_lamp_neg_start
			OT_Rcv_rotate_lamp_neg_stop = Rcv_rotate_lamp_neg_stop
			OT_Rcv_seat_lamp_pos_start = Rcv_seat_lamp_pos_start
			OT_Rcv_seat_lamp_pos_stop = Rcv_seat_lamp_pos_stop
			OT_Rcv_seat_lamp_neg_start = Rcv_seat_lamp_neg_start
			OT_Rcv_seat_lamp_neg_stop = Rcv_seat_lamp_neg_stop
			
			OT_Rcv_boom2_lamp_pos_start = Rcv_boom2_lamp_pos_start
			OT_Rcv_boom2_lamp_pos_stop = Rcv_boom2_lamp_pos_stop
			OT_Rcv_boom2_lamp_neg_start =Rcv_boom2_lamp_neg_start
			OT_Rcv_boom2_lamp_neg_stop = Rcv_boom2_lamp_neg_stop
			Lamp_tuttle_first_check = 1
	
		end
	

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_pos_start)
		temp_str = string.format("%d", Rcv_deric_lamp_pos_start)
		set_text(Current_screen,23,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_deric_lamp_pos_stop)
		set_text(Current_screen,19,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_neg_start)
		temp_str = string.format("%d", Rcv_deric_lamp_neg_start)
		set_text(Current_screen,20,temp_str)

		--temp_int = ToSigned8Bit(Rcv_deric_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_deric_lamp_neg_stop)
		set_text(Current_screen,24,temp_str)


		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_pos_start)
		temp_str = string.format("%d", Rcv_boom2_lamp_pos_start)
		set_text(Current_screen,30,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_boom2_lamp_pos_stop)
		set_text(Current_screen,31,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_neg_start)
		temp_str = string.format("%d", Rcv_boom2_lamp_neg_start)
		set_text(Current_screen,32,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom2_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_boom2_lamp_neg_stop)
		set_text(Current_screen,34,temp_str)


		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_pos_start)
		temp_str = string.format("%d", Rcv_rotate_lamp_pos_start)
		set_text(Current_screen,42,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_rotate_lamp_pos_stop)
		set_text(Current_screen,43,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_neg_start)
		temp_str = string.format("%d", Rcv_rotate_lamp_neg_start)
		set_text(Current_screen,49,temp_str)

		--temp_int = ToSigned8Bit(Rcv_rotate_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_rotate_lamp_neg_stop)
		set_text(Current_screen,56,temp_str)


		--temp_int = ToSigned8Bit(Rcv_seat_lamp_pos_start)
		temp_str = string.format("%d", Rcv_seat_lamp_pos_start)
		set_text(Current_screen,64,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_seat_lamp_pos_stop)
		set_text(Current_screen,65,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_neg_start)
		temp_str = string.format("%d", Rcv_seat_lamp_neg_start)
		set_text(Current_screen,66,temp_str)

		--temp_int = ToSigned8Bit(Rcv_seat_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_seat_lamp_neg_stop)
		set_text(Current_screen,68,temp_str)

		
		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_pos_start)
		temp_str = string.format("%d", Rcv_boom1_lamp_pos_start)
		set_text(Current_screen,74,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_pos_stop)
		temp_str = string.format("%d", Rcv_boom1_lamp_pos_stop)
		set_text(Current_screen,75,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_neg_start)
		temp_str = string.format("%d", Rcv_boom1_lamp_neg_start)
		set_text(Current_screen,76,temp_str)

		--temp_int = ToSigned8Bit(Rcv_boom1_lamp_neg_stop)
		temp_str = string.format("%d", Rcv_boom1_lamp_neg_stop)
		
		set_text(Current_screen,78,temp_str)
	end

	if Tuttle_lamp_send_flag == 1 then
		
		Lamp_tuttle_rx_arry[1] = ToSigned8Bit(Rcv_deric_lamp_pos_start)
		Lamp_tuttle_rx_arry[2] = ToSigned8Bit(Rcv_deric_lamp_pos_stop)
		Lamp_tuttle_rx_arry[3] = ToSigned8Bit(Rcv_deric_lamp_neg_start)
		Lamp_tuttle_rx_arry[4] = ToSigned8Bit(Rcv_deric_lamp_neg_stop)


		Lamp_tuttle_rx_arry[5] = ToSigned8Bit(Rcv_boom2_lamp_pos_start)
		Lamp_tuttle_rx_arry[6] = ToSigned8Bit(Rcv_boom2_lamp_pos_stop)
		Lamp_tuttle_rx_arry[7] = ToSigned8Bit(Rcv_boom2_lamp_neg_start)
		Lamp_tuttle_rx_arry[8] = ToSigned8Bit(Rcv_boom2_lamp_neg_stop)


		Lamp_tuttle_rx_arry[9] = ToSigned8Bit(Rcv_rotate_lamp_pos_start)
		Lamp_tuttle_rx_arry[10] = ToSigned8Bit(Rcv_rotate_lamp_pos_stop)
		Lamp_tuttle_rx_arry[11] = ToSigned8Bit(Rcv_rotate_lamp_neg_start)
		Lamp_tuttle_rx_arry[12] = ToSigned8Bit(Rcv_rotate_lamp_neg_stop)


		Lamp_tuttle_rx_arry[13] = ToSigned8Bit(Rcv_seat_lamp_pos_start)
		Lamp_tuttle_rx_arry[14] = ToSigned8Bit(Rcv_seat_lamp_pos_stop)
		Lamp_tuttle_rx_arry[15] = ToSigned8Bit(Rcv_seat_lamp_neg_start)
		Lamp_tuttle_rx_arry[16] = ToSigned8Bit(Rcv_seat_lamp_neg_stop)

		
		Lamp_tuttle_rx_arry[17] = ToSigned8Bit(Rcv_boom1_lamp_pos_start)
		Lamp_tuttle_rx_arry[18] = ToSigned8Bit(Rcv_boom1_lamp_pos_stop)
		Lamp_tuttle_rx_arry[19] = ToSigned8Bit(Rcv_boom1_lamp_neg_start)
		Lamp_tuttle_rx_arry[20] = ToSigned8Bit(Rcv_boom1_lamp_neg_stop)
		
		Judge = CompareTables(Lamp_tuttle_rx_arry, Lamp_tuttle_tx_arry)
		if Judge == true then 
			Tuttle_lamp_change_flag = 0
			Tuttle_lamp_send_flag = 0
			Tuttle_lamp_save_flag = 0
			Tx_can_rmt_para[4] = 0
			Tx_can_rmt_para[5] = 0
			set_visiable(Current_screen,28,0)
		end
	end
end


function Angle_disp_process()
	local temp_int = 0
	local temp_str = " "

	temp_int = CombineToSigned16_dec(Rcv_boom_angle_adc[1], Rcv_boom_angle_adc[2]) -- 입려치
	set_value(Current_screen,7,temp_int);

	temp_int = CombineToSigned16_dec(Rcv_boom_angle[1], Rcv_boom_angle[2]) -- 입려치
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,80,temp_str)
	set_value(Current_screen,13,temp_int+360);




	temp_int = CombineToSigned16_dec(Rcv_boom1_dist_adc[1], Rcv_boom1_dist_adc[2]) -- 입려치
	set_value(Current_screen,24,temp_int);

	temp_int = CombineToSigned16_dec(Rcv_boom1_out_lenght[1], Rcv_boom1_out_lenght[2]) -- 입려치
	set_value(Current_screen,29,temp_int);

	temp_int = CombineToSigned16_dec(Rcv_boom2_out_adc[1], Rcv_boom2_out_adc[2]) -- 입려치
	set_value(Current_screen,41,temp_int);

	temp_int = CombineToSigned16_dec(Rcv_boom2_out_lenght[1], Rcv_boom2_out_lenght[2]) -- 입려치
	set_value(Current_screen,58,temp_int);

end


function Otg_disp_process()
	local temp_int = 0
	local temp_str = " "

	temp_int = CombineToSigned16_dec(Rcv_otg_rate_fl_adc[1], Rcv_otg_rate_fl_adc[2]) -- 입려치
	set_value(Current_screen,19,temp_int)

	
	set_value(Current_screen,25,Rcv_otg_rate_fl)



	temp_int = CombineToSigned16_dec(Rcv_otg_rate_fr_adc[1], Rcv_otg_rate_fr_adc[2]) -- 입려치
	set_value(Current_screen,38,temp_int)

	
	set_value(Current_screen,43,Rcv_otg_rate_fr)

	temp_int = CombineToSigned16_dec(Rcv_otg_rate_rl_adc[1], Rcv_otg_rate_rl_adc[2]) -- 입려치
	set_value(Current_screen,7,temp_int)

	set_value(Current_screen,13,Rcv_otg_rate_rl)



	temp_int = CombineToSigned16_dec(Rcv_otg_rate_rr_adc[1], Rcv_otg_rate_rr_adc[2]) -- 입려치
	set_value(Current_screen,28,temp_int)

	
	set_value(Current_screen,33,Rcv_otg_rate_rr)

end


function Weight_init_disp()

	Weight_set_flag = 0

	local temp_int = 0
	local temp_str = " "

	set_visiable(Current_screen,58,0) 
	Help_show = 0

	temp_int = CombineToSigned16_dec(Rcv_max_weight_set[1], Rcv_max_weight_set[2]) -- pve roatate
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,11,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_min_weight_set[1], Rcv_min_weight_set[2]) -- pve roatate
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,13,temp_str)

	temp_int = CombineToSigned16_dec(Rcv_lmt_weight_set[1], Rcv_lmt_weight_set[2]) -- pve roatate
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,65,temp_str)
	

	temp_int = CombineToSigned16_dec(Rcv_500kg[1], Rcv_500kg[2]) -- pve roatate
	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,27,temp_str)
	

end

function Weight_disp_process()
	local temp_int = 0
	local temp_str = " "
	local compare1 = {0,0,0,0,0,0}
	local compare2 = {0,0,0,0,0,0}
	local judge = false




	if(Weight_set_flag == 2) then
		compare1[1] = Rcv_max_weight_set[1]
		compare1[2] = Rcv_max_weight_set[2]
		compare1[3] = Rcv_min_weight_set[1]
		compare1[4] = Rcv_min_weight_set[2]
		compare1[5] = Rcv_lmt_weight_set[1]
		compare1[6] = Rcv_lmt_weight_set[2]

		compare2[1] = Can_send_min_max[2]
		compare2[2] = Can_send_min_max[3]
		compare2[3] = Can_send_min_max[4]
		compare2[4] = Can_send_min_max[5]
		compare2[5] = Can_send_min_max[6]
		compare2[6] = Can_send_min_max[7]
		
		judge = CompareTables(compare1, compare2)
		if judge == true then Weight_set_flag = 0 end
		
	end	

	temp_int = CombineToSigned16_dec(Rcv_seat_kg_adc[1], Rcv_seat_kg_adc[2]) -- 입려치
	set_value(Current_screen,25,temp_int);

	temp_int = CombineToSigned16_dec(Rcv_boom1_rotate[1], Rcv_boom1_rotate[2]) -- 선회각도	
	set_value(Current_screen,29,temp_int+360);

	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,35,temp_str)
	

	temp_int = CombineToSigned16_dec(Rcv_boom1_rotate_adc[1], Rcv_boom1_rotate_adc[2]) -- 입려치
	set_value(Current_screen,33,temp_int+5000);

	temp_str = string.format("%d", temp_int)
	set_text(Current_screen,56,temp_str)
	


end

function Tilt_disp_process()

end

-- ============================================
-- 수평계 그래픽 화면 (screen 16)
-- ============================================
local dp_x_angle   = 0
local dp_y_angle   = 0
local main_angle_x = 0
local main_angle_y = 0
local COLOR_WHITE  = 0xFFFF

function Angle_main_disp_process()
	local temp_str = " "
	local x_warn   = 0
	local y_warn   = 0
	Level_angle_warn = 0

	dp_x_angle = CombineToSigned16_dec(Rcv_x_angle[2], Rcv_x_angle[1])
	dp_x_angle = dp_x_angle * -1
	dp_y_angle = CombineToSigned16_dec(Rcv_y_angle[2], Rcv_y_angle[1])

	if Rotate == 0 then
		main_angle_x = dp_x_angle - X_offset
		main_angle_y = dp_y_angle - Y_offset
	elseif Rotate == 90 then
		main_angle_x =  (dp_y_angle - Y_offset)
		main_angle_y = -(dp_x_angle - X_offset)
	elseif Rotate == 180 then
		main_angle_x = -(dp_x_angle - X_offset)
		main_angle_y = -(dp_y_angle - Y_offset)
	elseif Rotate == 270 then
		main_angle_x = -(dp_y_angle - Y_offset)
		main_angle_y =  (dp_x_angle - X_offset)
	end

	-- 각도 텍스트 표시
	temp_str = string.format("%.1f{", main_angle_x / 100)
	set_text(Current_screen, 5, temp_str)

	temp_str = string.format("%.1f{", main_angle_y / 100)
	set_text(Current_screen, 6, temp_str)

	-- 1도 초과시 경고 (100 = 1.00도)
	if main_angle_x >  100 then Level_angle_warn = 1  x_warn = 1 end
	if main_angle_x < -100 then Level_angle_warn = 1  x_warn = 1 end
	if main_angle_y >  100 then Level_angle_warn = 1  y_warn = 1 end
	if main_angle_y < -100 then Level_angle_warn = 1  y_warn = 1 end

	if x_warn == 1 then set_fore_color(Current_screen, 5, RED)
	else                set_fore_color(Current_screen, 5, COLOR_WHITE) end

	if y_warn == 1 then set_fore_color(Current_screen, 6, RED)
	else                set_fore_color(Current_screen, 6, COLOR_WHITE) end

	-- 센서값 들어오면 고정 물방울 이미지 숨김
	if main_angle_x ~= 0 or main_angle_y ~= 0 then
		set_visiable(Current_screen, 7, 0)
	else
		set_visiable(Current_screen, 7, 1)
	end

	-- 기포 위치 계산 및 화면 갱신
	Level_get_x, Level_get_y = AngleToCoordinate(main_angle_x, main_angle_y)
	redraw()
end





Pw_table = 0
Pw_str  =  " "

function Manage_pw_disp_init()


	Can_send_min_max[2] = Rcv_max_weight_set[1]
	Can_send_min_max[3] = Rcv_max_weight_set[2]

	Can_send_min_max[4] = Rcv_min_weight_set[1]
	Can_send_min_max[5] = Rcv_min_weight_set[2]

	Can_send_min_max[6] = Rcv_lmt_weight_set[1]
	Can_send_min_max[7] = Rcv_lmt_weight_set[2]
	set_visiable(Current_screen,3,1)
	set_enable(Current_screen,3,1)


	--set_text(Current_screen,4,temp_str)
	Help_show = 0


end


Msg_str = ""
Alam_cnt = 0
Alam_cnt_old = 0
Test_my = {0,0}
function Msg_process()
	local get_str = ""
	local ment_str = ""
	local judge_cnt = 10
	local jude = true
	local msg_cnt = 0
	Msg_str = "" 
	
	--set_value(Current_screen, 61, judge_cnt)

    
		if Rcv_alarm_msg[1]&BIT0 == BIT0 then get_str = string.format("회전+ 제한이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
		
		if Rcv_alarm_msg[1]&BIT1 == BIT1 then get_str = string.format("회전- 제한이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[1]&BIT2 == BIT2 then get_str = string.format("길이 제한이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
				
		if Rcv_alarm_msg[1]&BIT3 == BIT3 then get_str = string.format("로드셀 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
	
		if Rcv_alarm_msg[1]&BIT4 == BIT4 then get_str = string.format("과전압 입력\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
	
		if Rcv_alarm_msg[1]&BIT5 == BIT5 then get_str = string.format("중량 초과\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
	
		if Rcv_alarm_msg[1]&BIT6 == BIT6 then get_str = string.format("선회센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[1]&BIT7 == BIT7 then get_str = string.format("아웃트리거 \n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[2]&BIT0 == BIT0 then get_str = string.format("통신 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[2]&BIT1 == BIT1 then get_str = string.format("아우트리거 +제한이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		
		if Rcv_alarm_msg[2]&BIT2 == BIT2 then get_str = string.format("아우트리거 -제한이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[2]&BIT3 == BIT3 then get_str = string.format("+틸팅 초과이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end					
		
		
		if Rcv_alarm_msg[2]&BIT4 == BIT4 then get_str = string.format("-틸팅 초과이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[2]&BIT5 == BIT5 then get_str = string.format("길이센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end	

		if Rcv_alarm_msg[2]&BIT6 == BIT6 then get_str = string.format("중간잭 주의\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[2]&BIT7 == BIT7 then get_str = string.format("OR 충돌센서 감지\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end	

		if Rcv_alarm_msg[3]&BIT0 == BIT0 then get_str = string.format("비상 정지\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[3]&BIT1 == BIT1 then get_str = string.format("밧데리 저전압\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		
		if Rcv_alarm_msg[3]&BIT2 == BIT2 then get_str = string.format("써밍 통신이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[3]&BIT3 == BIT3 then get_str = string.format("자동복귀 주의\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end					
		
		
		if Rcv_alarm_msg[3]&BIT4 == BIT4 then get_str = string.format("하부 통신 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[3]&BIT5 == BIT5 then get_str = string.format("FL 아웃트리거 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end	

		if Rcv_alarm_msg[3]&BIT6 == BIT6 then get_str = string.format("FR 아웃트리거 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[3]&BIT7 == BIT7 then get_str = string.format("주의 구간\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end		


		if Rcv_alarm_msg[4]&BIT0 == BIT0 then get_str = string.format("윈치 센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[4]&BIT1 == BIT1 then get_str = string.format("풍속 센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
	
		if Rcv_alarm_msg[4]&BIT2 == BIT2 then get_str = string.format("풍속 초과\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[4]&BIT3 == BIT3 then get_str = string.format("각도 센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end					
		
		
		if Rcv_alarm_msg[4]&BIT4 == BIT4 then get_str = string.format("틸팅 각도 센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[4]&BIT5 == BIT5 then get_str = string.format("RL 아웃트리거 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end	

		if Rcv_alarm_msg[4]&BIT6 == BIT6 then get_str = string.format("RR 아웃트리거 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[4]&BIT7 == BIT7 then get_str = string.format("탑승함 좌우 회전센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end	


		if Rcv_alarm_msg[5]&BIT0 == BIT0 then get_str = string.format("FL 길이센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[5]&BIT1 == BIT1 then get_str = string.format("FR 길이센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end
	
		if Rcv_alarm_msg[5]&BIT2 == BIT2 then get_str = string.format("RL 길이센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[5]&BIT3 == BIT3 then get_str = string.format("RR 길이센서 이상\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end					
		
		
		if Rcv_alarm_msg[5]&BIT4 == BIT4 then get_str = string.format("겉붐 인출 제한\n")
			Msg_str = string.format("%s%s", Msg_str,get_str)
			msg_cnt = msg_cnt+1 end

		if Rcv_alarm_msg[5]&BIT5 == BIT5 then get_str = string.format("최대 중량 초과\n")
			Msg_str = string.format("%s%s", Msg_str, get_str)
			msg_cnt = msg_cnt+1 end	

		if Rcv_alarm_msg[5]&BIT6 == BIT6 then get_str = string.format("붐인출제한(중량)\n")
			Msg_str = string.format("%s%s", Msg_str, get_str)
			msg_cnt = msg_cnt+1 end		

		if Rcv_alarm_msg[5]&BIT7 == BIT7 then get_str = string.format("붐인출제한(ORL)\n")
			Msg_str = string.format("%s%s", Msg_str, get_str)
			msg_cnt = msg_cnt+1 end			
		
		if msg_cnt == 1  then  
			ment_str = string.format("%s", get_str)
			set_text(Current_screen,200,ment_str)
			set_visiable(Current_screen,202,0)
			Msg_box_visible = 0
			set_enable(Current_screen,201,0)

		end

				
			if msg_cnt > 1 and Msg_box_visible == 0 then  
			ment_str = string.format("%d개의 알람이 있습니다", msg_cnt)
			set_text(Current_screen,200,ment_str)
			set_enable(Current_screen,201,1)
		end


		if Msg_box_visible == 1 then set_text(Current_screen,200,Msg_str) end
		if msg_cnt == 0 then
			set_fore_color(Current_screen,200,Title_Blue)
			set_enable(Current_screen,201,0)
			ment_str = string.format("정상 상태")
			set_text(Current_screen,200,ment_str)	
			set_visiable(Current_screen,202,0)
			Msg_box_visible = 0
		end	
		Alam_cnt = msg_cnt



end