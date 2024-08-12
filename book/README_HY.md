# User authentication
# https://www.youtube.com/watch?v=diB38AvVkHw

# authenticate() keeps return None, if user is marked as inactive (is_active=False / is_active=0 in db)
To make authenticate() function works, is_active must be 1 (user is activated)
1. Authenticate using email
First, change models.py, set 
email = models.EmailField(..., unique=True)
USERNAME_FIELD="email"
REQUIRED_FIELDS=["username"]

Second, change serializer.py, use the one that return results (see below)
authenticate(email=clean_data["email"], password=clean_data["password"]) =  create: haha2
authenticate(username=clean_data["email"], password=clean_data["password"]) =  create: haha2
authenticate(username=clean_data["username"], password=clean_data["password"]) = create: None

2. Authenticate using username
First, change models.py, set 
username = models.CharField(..., unique=True)
USERNAME_FIELD="username"
REQUIRED_FIELDS=[]

Second, change serializer.py, use the one that return results (see below)
authenticate(email=clean_data["email"], password=clean_data["password"]) =  create: None
authenticate(username=clean_data["email"], password=clean_data["password"]) =  create: None
authenticate(username=clean_data["username"], password=clean_data["password"]) =  create: haha2

<!-- https://prnt.sc/eHLsAdLM_7vt -->
You can try to check session id in web dev tools (create session id when login, remove when logout)