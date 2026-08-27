"""
Smart Urban Services - Sri Lankan National ID (NIC) AI Validator
Module: ai/models/nic_validator.py
"""

import re
from datetime import datetime
from typing import Dict, Any


class SriLankanNICValidator:
    """
    Validates and extracts demographic data from official Sri Lankan National Identity Cards (NIC):
    - Old Format: 9 digits + 'V' or 'X' (e.g. 882410928V)
    - New Format: 12 digits (e.g. 198824109281)
    """

    DAYS_IN_MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    def validate_and_parse(self, raw_nic: str) -> Dict[str, Any]:
        cleaned = str(raw_nic).strip().upper()

        is_old = bool(re.match(r"^[0-9]{9}[VX]$", cleaned))
        is_new = bool(re.match(r"^[0-9]{12}$", cleaned))

        if not is_old and not is_new:
            return {
                "valid": False,
                "error": "Invalid format. Expected 9 digits + 'V'/'X' or 12 numeric digits.",
                "nic": cleaned,
            }

        try:
            if is_old:
                year = 1900 + int(cleaned[0:2])
                day_of_year = int(cleaned[2:5])
                serial = cleaned[5:8]
                check_digit = cleaned[8]
                format_type = "OLD_9_DIGIT"
            else:
                year = int(cleaned[0:4])
                day_of_year = int(cleaned[4:7])
                serial = cleaned[7:11]
                check_digit = cleaned[11]
                format_type = "NEW_12_DIGIT"

            # Gender Determination (female day_of_year has 500 added)
            if day_of_year > 500:
                gender = "FEMALE"
                day_of_year -= 500
            else:
                gender = "MALE"

            if day_of_year < 1 or day_of_year > 366:
                return {
                    "valid": False,
                    "error": f"Invalid day of year: {day_of_year}",
                    "nic": cleaned,
                }

            # Approximate Day and Month
            month = 1
            days_accum = 0
            for m_idx, m_days in enumerate(self.DAYS_IN_MONTHS):
                if day_of_year <= days_accum + m_days:
                    month = m_idx + 1
                    day = day_of_year - days_accum
                    break
                days_accum += m_days

            dob_str = f"{year}-{month:02d}-{day:02d}"

            # Calculate Age
            current_year = datetime.now().year
            age = current_year - year

            return {
                "valid": True,
                "nic": cleaned,
                "format_type": format_type,
                "birth_year": year,
                "date_of_birth": dob_str,
                "estimated_age": age,
                "gender": gender,
                "serial_number": serial,
                "checksum_digit": check_digit,
                "is_adult": age >= 18,
            }
        except Exception as e:
            return {
                "valid": False,
                "error": str(e),
                "nic": cleaned,
            }
