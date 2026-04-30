

Password_table = {19,33,51,64,84,82,96,9,40,99,69,91,94,36,29,30,81,24,21,18,38,76,11,44,75,12,48,50,62 ,74,86,98,4,31,56,79,3,66,63,0}

Opw_str = " "
function Pw_cal()
	local year = 0
	local mon = 0
	local day = 0
	local hour = 0
	local min = 0
	local sec = 0
	local week = 0

 	year,mon,day,hour,min,sec,week = get_date_time()
	--center_str[1] = ghpw_str[5]
	--center_str[2] = ghpw_str[6]
	hour = hour+20
	local center_str = Gpw_str:sub(5,6)
	local center_int = tonumber(center_str)
	if center_int >0 and center_int < 41 then
	Opw_str = string.format("%02d%02d%s%02d",hour,day,center_str,Password_table[center_int])
	
	write_flash_string(0,center_str)
	flush_flash()
	Flash_code_str = center_str
	--set_text(Current_screen,5,center_str)
	end	

end

function ToSigned8Bit(value)
    if value > 127 then
		value = value-256	
       
    end
    return value
end



function CompareTables(table1, table2)
    for key, value in pairs(table1) do
        if table2[key] ~= value then
            return false
        end
    end
    return true
end


function Split16to8(value)
	local low_byte = value & 0xFF -- 하위 8비트 추출
	local high_byte = (value >> 8) & 0xFF -- 상위 8비트 추출
	return  high_byte, low_byte
  end


function Bit_mask_bit(data, mask)
	local out = 0
	if data&mask == mask then out =  1 end
	return out
end

function Lshift(x, n)
	return x * (2^n)
end

function Rshift(x, n)
	return math.floor(x / (2^n))
  end
  

function Bit_mask_bit_n(data, mask)
	local out = 1
	if data&mask == mask then out =  0 end
	return out
end

function CombineToSigned16_f100(highByte, lowByte)
	local combined = 0
	combined = (highByte << 8) | lowByte
	local f_return = 0
	-- 16비트 signed 정수로 변환
	if combined >= 0x8000 then
	  combined = combined - 0x10000
	end
	f_return = combined/100

	return f_return
  end



  function CombineToSigned16_f10(highByte, lowByte)
	local combined = 0
	combined = (highByte << 8) | lowByte
	local f_return = 0
	-- 16비트 signed 정수로 변환
	if combined >= 0x8000 then
	  combined = combined - 0x10000
	end
	f_return = combined/10

	return f_return
  end


  function CombineToSigned16_dec(highByte, lowByte)
	local combined = 0
	combined = (highByte << 8) | lowByte
	-- 16비트 signed 정수로 변환
	if combined >= 0x8000 then
	  combined = combined - 0x10000
	end

	return combined
  end





function Range_to_bit(data, min, max) -- 
	local result = 0
	if data >= min and data <= max then result = 1 end
	return result
end
