import re
import time
from dataclasses import dataclass
from typing import Dict, Optional, List, Set
from datetime import datetime, timedelta
from enum import Enum, auto

class AccessTier(Enum):
    COMMUNITY = "community"  # Basic single auth, regional optimization
    PROFESSIONAL = "professional"  # Double auth required
    BLOCKED = "blocked"  # Dr. Grant experience
    
class AuthProvider(Enum):
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    OUTLOOK = "outlook"

@dataclass
class VisitorProfile:
    name: str
    current_company: Optional[str]
    known_emails: Set[str]
    previous_companies: Set[str]
    linkedin_url: Optional[str]

@dataclass
class AuthenticationStatus:
    is_authenticated: bool
    primary_auth: Optional[AuthProvider] = None
    secondary_auth: Optional[AuthProvider] = None
    timestamp: datetime
    gift_id: Optional[str] = None
    attempt_count: int = 0
    verification_timeout: datetime = None
    visitor_profile: Optional[VisitorProfile] = None
    auth_attempts: List[Dict] = None
    access_tier: AccessTier = AccessTier.COMMUNITY
    region: Optional[str] = None
    is_linkedin_pro: bool = False

class PEMailing_List:
    def __init__(self):
        self.integrations = IntegrationsGateway()
    def __init__(self):
        self.allowed_domains = {
            'coaching2100.com',
            'fabriziosassano.com',
            '2100.cool'
        }
        
        self.special_attention_companies = {
            'Manpower': {
                'domains': {'manpower.com', 'manpower.co.uk', 'manpower.fr', 'manpower.de',
                        'manpower.es', 'manpower.it', 'manpower.nl', 'manpower.au',
                        'manpower.ca', 'manpower.jp', 'manpower.cn', 'manpower.sg',
                        'manpower.in', 'manpower.br', 'manpower.mx'},
                'auth_required': {AuthProvider.LINKEDIN, AuthProvider.GOOGLE}
            },
            'LHH': {
                'domains': {'lhh.com', 'right.com', 'dbm.com', 'risesmart.com'},
                'auth_required': {AuthProvider.LINKEDIN, AuthProvider.OUTLOOK}
            },
            'Ezra': {
                'domains': {'ezra.com', 'ezra.co.uk', 'ezra.ai'},
                'auth_required': {AuthProvider.LINKEDIN, AuthProvider.GOOGLE}
            },
            'Maan Hamdan Group': {
                'domains': {'insala.com', 'hamdans.com', 'techgenies.com', 'hexagf.com'},
                'auth_required': {AuthProvider.LINKEDIN, AuthProvider.OUTLOOK}
            },
            'BetterUp': {
                'domains': {'betterup.com'},
                'auth_required': {AuthProvider.LINKEDIN, AuthProvider.GOOGLE}
            }
        }

        self.tracked_individuals = {
            'Nick Goldberg': VisitorProfile(
                name="Nick Goldberg",
                current_company="Ezra",
                known_emails={'ngold22@gmail.com', 'nick@ezra.co.uk'},
                previous_companies={'LHH', 'Right Management'},
                linkedin_url="linkedin.com/in/nickgoldberg"
            ),
            'Kim Leverette Cherry': VisitorProfile(
                name="Kim Leverette Cherry",
                current_company="LHH",
                known_emails={'kim.leverette@lhh.com'},
                previous_companies={'DBM', 'Right Management'},
                linkedin_url="linkedin.com/in/kimlevettecherry"
            ),
            'Andrew Graham': VisitorProfile(
                name="Andrew Graham",
                current_company="Unknown",
                known_emails={'andrew.graham@lhh.com', 'agraham@dbm.com'},
                previous_companies={'LHH', 'DBM'},
                linkedin_url="linkedin.com/in/andrewgraham"
            )
        }
        
        self.auth_sessions = {}  # email -> AuthenticationStatus
        self.prying_eyes_log = []  # Track suspicious access attempts
        self.verification_window = timedelta(minutes=5)

    def validate_email_domain(self, email: str) -> bool:
        """Validates if email domain is allowed and not blocked"""
        if not email or '@' not in email:
            return False
            
        domain = email.split('@')[1].lower()
        
        if domain in self.blocked_domains:
            self.log_suspicious_attempt(email, "Blocked domain access attempt")
            return False
            
        return True

    def detect_linkedin_pro(self, email: str) -> bool:
        """Checks if user appears to be a LinkedIn professional"""
        if not email:
            return False
            
        visitor = next((v for v in self.tracked_individuals.values() 
                    if email in v.known_emails), None)
                    
        if visitor and visitor.linkedin_url:
            return True
            
        return False

    def optimize_for_region(self, email: str) -> str:
        """Determines region for community product optimization"""
        domain = email.split('@')[1] if '@' in email else ''
        tld = domain.split('.')[-1] if '.' in domain else ''
        
        region_map = {
            'mx': 'LATAM',
            'br': 'LATAM',
            'uk': 'EUROPE',
            'de': 'EUROPE',
            'fr': 'EUROPE',
            'in': 'ASIA',
            'sg': 'ASIA',
            'au': 'APAC'
        }
        
        return region_map.get(tld.lower(), 'GLOBAL')

    def validate_linkedin_keys(self, client_id: str, secret: str) -> bool:
        """Validates LinkedIn app credentials and secrets"""
        if not client_id or not secret:
            return False
            
        if client_id != self.integrations.dr_match.client_id:
            return False
            
        # Check against both primary and secondary secrets
        return (secret == self.integrations.dr_match.primary_secret or 
                secret == self.integrations.dr_match.secondary_secret)
        """Initiates verification process with 5-minute window"""
        email = email.lower()
        session = self.auth_sessions.get(email)
        
        # Check if this is first or second authentication
        if not session:
            # New verification attempt
            gift_id = f"GIFT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            session = AuthenticationStatus(
                is_authenticated=False,
                primary_auth=auth_provider,
                timestamp=datetime.now(),
                gift_id=gift_id,
                verification_timeout=datetime.now() + timedelta(minutes=5),
                auth_attempts=[]
            )
            self.auth_sessions[email] = session
            return gift_id
        
        # Validate second authentication
        if session.attempt_count >= 2:
            self.log_suspicious_attempt(email, "Exceeded maximum attempts")
            return None
            
        if datetime.now() > session.verification_timeout:
            del self.auth_sessions[email]
            return None
            
        # Check if authentication providers are valid combination
        if not self._is_valid_auth_combo(session.primary_auth, auth_provider):
            self.log_suspicious_attempt(email, "Invalid authentication combination")
            return None
            
        session.secondary_auth = auth_provider
        session.attempt_count += 1
        return session.gift_id

    def _is_valid_auth_combo(self, primary: AuthProvider, secondary: AuthProvider) -> bool:
        """Validates if authentication provider combination is acceptable"""
        valid_combos = {
            frozenset({AuthProvider.LINKEDIN, AuthProvider.GOOGLE}),
            frozenset({AuthProvider.LINKEDIN, AuthProvider.OUTLOOK})
        }
        return frozenset({primary, secondary}) in valid_combos
            
        gift_id = f"GIFT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        self.auth_sessions[email] = AuthenticationStatus(
            is_authenticated=False,
            auth_method=auth_method,
            timestamp=datetime.now(),
            gift_id=gift_id,
            verification_timeout=datetime.now() + self.verification_window
        )
        
        return gift_id

    def assign_access_tier(self, auth_status: AuthenticationStatus) -> AccessTier:
        """Determines appropriate access tier based on authentication status"""
        if auth_status.is_linkedin_pro and not auth_status.secondary_auth:
            return AccessTier.BLOCKED  # Trigger Dr. Grant experience
        
        if auth_status.secondary_auth:
            return AccessTier.PROFESSIONAL
        
        return AccessTier.COMMUNITY

    def verify_authentication(self, email: str, corp_email: Optional[str] = None) -> bool:
        """Verifies authentication within time window"""
        auth_status = self.auth_sessions.get(email)
        
        if not auth_status:
            return False
            
        if datetime.now() > auth_status.verification_timeout:
            del self.auth_sessions[email]
            return False
            
        # Verify corporate email if provided
        if corp_email and not self.validate_email_domain(corp_email):
            self.log_suspicious_attempt(email, "Invalid corporate email provided")
            return False
            
        auth_status.is_authenticated = True
        # Verify with LinkedIn Dr Match if email exists
        linkedin_id = self.get_linkedin_id(email)
        if linkedin_id:
            auth_status.is_linkedin_pro = self.integrations.authenticate_linkedin(linkedin_id)
        else:
            auth_status.is_linkedin_pro = self.detect_linkedin_pro(email)
        
        # Assign access tier based on authentication level
        auth_status.access_tier = self.assign_access_tier(auth_status)
        
        # For community access, optimize region
        if auth_status.access_tier == AccessTier.COMMUNITY:
            auth_status.region = self.optimize_for_region(email)
        
        return True

    def log_suspicious_attempt(self, email: str, reason: str):
        """Logs suspicious access attempts"""
        entry = {
            'email': email,
            'timestamp': datetime.now(),
            'reason': reason
        }
        self.prying_eyes_log.append(entry)

    def grant_temporary_access(self, email: str) -> bool:
        """Grants 5-minute access for gift verification"""
        auth_status = self.auth_sessions.get(email)
        
        if not auth_status:
            return False
            
        if auth_status.attempt_count >= 2:
            self.log_suspicious_attempt(email, "Exceeded verification attempts")
            return False
            
        auth_status.attempt_count += 1
        auth_status.verification_timeout = datetime.now() + self.verification_window
        return True

