import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

class SMSProvider:
    """Base class for all SMS providers to ensure consistency."""
    def send(self, to, message):
        raise NotImplementedError("Subclasses must implement send()")

class SimulationProvider(SMSProvider):
    """Fallback provider for development/simulation mode."""
    def send(self, to, message):
        logger.info(f"[SIMULATED SMS] TO: {to} | MSG: {message}")
        return True, "Simulated: SMS sent"

class TwilioProvider(SMSProvider):
    """Real implementation for Twilio SMS gateway."""
    def __init__(self, account_sid, auth_token, from_number):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

    def send(self, to, message):
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
            data = {
                'To': to,
                'From': self.from_number,
                'Body': message
            }
            response = requests.post(url, data=data, auth=(self.account_sid, self.auth_token))
            if response.status_code in [200, 201]:
                return True, "Twilio: SMS sent successfully"
            return False, f"Twilio Error: {response.json().get('message', 'Unknown failure')}"
        except Exception as e:
            logger.error(f"Twilio provider error: {e}")
            return False, str(e)

class TermiiProvider(SMSProvider):
    """Real implementation for Termii (African Gateway)."""
    def __init__(self, api_key, sender_id):
        self.api_key = api_key
        self.sender_id = sender_id

    def send(self, to, message):
        try:
            url = "https://api.ng.termii.com/api/sms/send"
            payload = {
                "to": to,
                "from": self.sender_id,
                "sms": message,
                "type": "plain",
                "channel": "generic",
                "api_key": self.api_key,
            }
            headers = {'Content-Type': 'application/json'}
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            if response.status_code == 200:
                return True, "Termii: SMS sent successfully"
            return False, f"Termii Error: {response.json().get('message', 'Unknown failure')}"
        except Exception as e:
            logger.error(f"Termii provider error: {e}")
            return False, str(e)

def get_sms_provider():
    """Factory to get the correct provider based on environment settings."""
    provider_type = os.environ.get('SMS_PROVIDER', 'simulation').lower()
    
    if provider_type == 'twilio':
        return TwilioProvider(
            os.environ.get('TWILIO_ACCOUNT_SID'),
            os.environ.get('TWILIO_AUTH_TOKEN'),
            os.environ.get('TWILIO_FROM_NUMBER')
        )
    elif provider_type == 'termii':
        return TermiiProvider(
            os.environ.get('TERMII_API_KEY'),
            os.environ.get('TERMII_SENDER_ID', 'SANCTUARY')
        )
    
    return SimulationProvider()
