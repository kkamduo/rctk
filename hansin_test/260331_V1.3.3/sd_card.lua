cjson = require "cjson"
lfs = require "lfs"
--bit32 = require "bit32"




Csv_data_str =  {"","","","",""}



function Csv_addWriteEnd(filename, info)
   local csv_info = ''
   local wfile    = io.open(filename, 'a+')
   
   csv_info = csv_info..info..'\n'
   
   if wfile ~= nil
   then
      wfile:write(csv_info)
      --wfile:close()
   end
   
   wfile:close()
   
end


function Folder_del()  

	local fold_name = string.format("C://%4d%02d",Year-3,Mon)
    
    for file in lfs.dir(fold_name) do
        if file ~= "." and file ~= ".." then
            local file_path = fold_name .. "/" .. file
            os.remove(file_path)
        end
    end
    -- 폴더 삭제
    local success, err = lfs.rmdir(fold_name)
end



function File_creation ()
local dada_str = ""

Init_day = Day
Dir_name = string.format("C://%4d%02d",Year,Mon)
lfs.mkdir(Dir_name)
File_name = string.format("C://%4d%02d/%02d_%02d.csv", Year,Mon,Mon,Day)
dada_str = string.format("ID,No,TIME,S,G,L,A,R,G_HEX,W,T,CODE1,CODE2,CODE3,CODE4,CODE5,ORFL,ORFR,ORRL,ORRR,MODE,DERIC_O,BOOM2_O,ROTATE_O,SEAT_O,BOOM1_O,RMT_DERIC,RMT_BOOM,RMT_ROTATE,RMT_SEAT,TILT_OUT ")
Csv_addWriteEnd(File_name,dada_str)

end 

function ToBinary(num)
    local binary = ""
    while num > 0 do
        local bit = num % 2
        binary = bit .. binary
        num = math.floor(num / 2)
    end
    return binary == "" and "0" or binary
end

Log_cnt = 0
function  Data_logging(tic)

	local time_stamp = " "
	local log_lenght = 0.0
	local log_boom_angle = 0
	local log_weight = 0
	local log_rotate = 0
	local log_wind = 0.0
	local log_tilt = 0
	local log_str = " "
	local log_mode = " "
	local temp = 0
	local temp2 = 0
	--local temp_str = " "



	--local code_bin = {"","","","",""}
	Year,Mon,Day,Hour,Min,Sec,Week = get_date_time()
	if(Init_day ~= Day) then 
	File_creation()
	Init_Day = Day
	end

	time_stamp = string.format("%d.%d.%d %d:%d:%d ",Year,Mon,Day,Hour,Min,Sec)
	log_weight = CombineToSigned16_dec(Rcv_seat_kg[1], Rcv_seat_kg[2])

	log_lenght = CombineToSigned16_f100(Rcv_boomt_out_lenght[1], Rcv_boomt_out_lenght[2])
	log_boom_angle = CombineToSigned16_dec(Rcv_boom_angle[1], Rcv_boom_angle[2])
	--log_boom_angle = log_boom_angle-360

	log_rotate = CombineToSigned16_dec(Rcv_boom1_rotate[1], Rcv_boom1_rotate[2])
	--log_rotate = log_rotate-360
	log_wind = CombineToSigned16_f10(Rcv_wind[1], Rcv_wind[2])
	log_tilt = CombineToSigned16_dec(Rcv_seat_tilt[1], Rcv_seat_tilt[2])

	local log_tilt_out = 0
	
	local code_bin1  = ToBinary(Rcv_alarm_msg[1])
	local code_bin2  = ToBinary(Rcv_alarm_msg[2])
	local code_bin3  = ToBinary(Rcv_alarm_msg[3])
	local code_bin4 = ToBinary(Rcv_alarm_msg[4])
	local code_bin5 = ToBinary(Rcv_alarm_msg[5])
	if Get_current_mode == 0 then log_mode = "Rabbit" end
	if Get_current_mode == 1 then log_mode = "Tuttle" end
	local log_deric_o = CombineToSigned16_dec(Rcv_pve_deric[1], Rcv_pve_deric[2])
	local log_boom2_o = CombineToSigned16_dec(Rcv_pve_boom2[1], Rcv_pve_boom2[2]) 
	local log_rotate_o = CombineToSigned16_dec(Rcv_pve_rotate[1], Rcv_pve_rotate[2]) 
	local log_seat_o = CombineToSigned16_dec(Rcv_pve_seat[1], Rcv_pve_seat[2]) 
	local log_boom1_o = CombineToSigned16_dec(Rcv_pve_boom[1], Rcv_pve_boom[2])
	local log_500 =  CombineToSigned16_dec(Rcv_seat_kg_adc[1], Rcv_seat_kg_adc[2])
	local log_safe = CombineToSigned16_dec(Rcv_safe_rate[1], Rcv_safe_rate[2])

	log_tilt_out = Rcv_rmt_tilt

	temp = Rcv_io_ind[7]& 0x06
	temp2 = Lshift(temp,1)
	log_tilt_out = log_tilt_out|temp2
	local log_tilt_bin =  ToBinary(log_tilt_out)
	--temp_str = string.format("%s", log_tilt_bin) 
	--set_text(0,24,temp_str)




	--temp = bit32.band(Rcv_io_ind[7], 6)
	--temp = bit32.rshift(temp, 1)
	--log_tilt_out = log_tilt_out + temp


	--local log_rmt_deric = ToSigned8Bit(Rcv_rmt_deric)
	--local log_rmt_boom = ToSigned8Bit(Rcv_rmt_shirnk)
	--local log_rmt_roate = ToSigned8Bit(Rcv_rmt_rotate)
	--local log_rmt_seat = ToSigned8Bit(Rcv_rmt_bucket)


     --TIME,G,L,A,R,W,T,CODE1,CODE2,CODE3,CODE4,CODE5,MODE,ORFL,ORFR,ORRL,ORRR,DERIC_O,BOOM2_O,ROTATE_O,SEAT_O,BOOM1_O,RMT_DERIC,RMT_BOOM,RMT_ROTATE,RMT_SEAT ")
	--Csv_data_str[tic] = string.format("%s,%d,%d,%f,%d,%f,%f,%d,%d,%d,%d,%d,%d,%d,%d,%d",time_stamp, log_weight,log_boom_angle,log_lenght,log_rotate,log_wind,log_tilt,Rcv_alarm_msg[1], Rcv_alarm_msg[2],Rcv_alarm_msg[3],Rcv_alarm_msg[4],Rcv_alarm_msg[5], Rcv_otg_rate_fl,Rcv_otg_rate_fr,Rcv_otg_rate_rl,Rcv_otg_rate_rr )
	--Csv_data_str[tic] = string.format("%s,%d,%s,%d,%d,%f,%d,%d,%f,%f,%s,%s,%s,%s,%s,%d,%d,%d,%d,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d",Flash_code_str,Log_cnt,time_stamp,log_weight,log_lenght,log_boom_angle,log_rotate,log_500,log_wind,log_tilt,code_bin1,code_bin2,code_bin3,code_bin4,code_bin5,  Rcv_otg_rate_fl,Rcv_otg_rate_fr,Rcv_otg_rate_rl,Rcv_otg_rate_rr,log_mode, log_deric_o, log_boom2_o, log_rotate_o, log_seat_o,log_boom1_o, Rcv_rmt_deric, Rcv_rmt_shirnk, Rcv_rmt_rotate, Rcv_rmt_bucket )
	Log_cnt = Log_cnt+1
	--log_str = string.format("%s,%d,%s,%d,%d,%f,%d,%d,%f,%f,%s,%s,%s,%s,%s,%d,%d,%d,%d,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d",Flash_code_str,Log_cnt,time_stamp,log_weight,log_lenght,log_boom_angle,log_rotate,log_500,log_wind,log_tilt,code_bin1,code_bin2,code_bin3,code_bin4,code_bin5,  Rcv_otg_rate_fl,Rcv_otg_rate_fr,Rcv_otg_rate_rl,Rcv_otg_rate_rr,log_mode, log_deric_o, log_boom2_o, log_rotate_o, log_seat_o,log_boom1_o, Rcv_rmt_deric, Rcv_rmt_shirnk, Rcv_rmt_rotate, Rcv_rmt_bucket )
	
	Csv_data_str[tic]  = string.format("%s,%d,%s,%d,%d,%f,%d,%d,%d,%f,%d,%s,%s,%s,%s,%s,%d,%d,%d,%d,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d,%s",Flash_code_str,Log_cnt,time_stamp,log_safe,log_weight,log_lenght,  log_boom_angle,log_rotate,log_500,log_wind,  log_tilt,   code_bin1,code_bin2,code_bin3,code_bin4,code_bin5,  Rcv_otg_rate_fl,Rcv_otg_rate_fr,Rcv_otg_rate_rl,Rcv_otg_rate_rr,log_mode, log_deric_o, log_boom2_o, log_rotate_o, log_seat_o,log_boom1_o, Rcv_rmt_deric, Rcv_rmt_shirnk, Rcv_rmt_rotate, Rcv_rmt_bucket,log_tilt_bin )
	
	--csv_addWriteEnd(File_name,log_str)
	if tic == 5 then
	
		log_str = string.format("%s\n%s\n%s\n%s\n%s", Csv_data_str[1],Csv_data_str[2],Csv_data_str[3],Csv_data_str[4],Csv_data_str[5])
		Csv_addWriteEnd(File_name,log_str)
	end



end