import requests

def fetch_location_from_zip(zip_code, country_code='us'):
    """
    Fetches location data from Zippopotam.us API.
    
    Args:
        zip_code (str): The postal code to lookup.
        country_code (str): The IS0 3166-1 alpha-2 country code (default: 'us').
    
    Returns:
        dict: A dictionary containing 'city', 'state', 'latitude', 'longitude', 'country', 'zip_code'.
              Returns None if the zip code is invalid or not found.
    
    Raises:
        requests.RequestException: If the external API call fails due to network/server issues.
    """
    if not country_code:
        country_code = 'us'
        
    url = f"http://api.zippopotam.us/{country_code}/{zip_code}"
    
    # We let RequestException bubble up to be handled by the view for 503 responses
    response = requests.get(url, timeout=5)
    
    if response.status_code == 404:
        return None
        
    response.raise_for_status()
    
    try:
        data = response.json()
    except ValueError:
        return None
    
    places = data.get('places', [])
    if not places:
        return None
        
    # We take the first place as the primary location
    primary_place = places[0]
    
    return {
        'city': primary_place.get('place name'),
        'state': primary_place.get('state'),
        'state_abbr': primary_place.get('state abbreviation'),
        'latitude': primary_place.get('latitude'),
        'longitude': primary_place.get('longitude'),
        'country': data.get('country'),
        'country_code': data.get('country abbreviation'),
        'zip_code': data.get('post code')
    }
