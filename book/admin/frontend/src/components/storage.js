//for JWT token
class JwtTokenManager  {
    constructor() {
      this.jwt_token = 'jwtToken';
    }
  
    // Save the JWT token to local storage
    saveToken(token) {
      localStorage.setItem(this.jwt_token, token);
    }
  
    // Retrieve the JWT token from local storage
    getToken() {
      return localStorage.getItem(this.jwt_token);
    }
  
    // Clear the JWT token from local storage
    clearToken() {
      localStorage.removeItem(this.jwt_token);
    }
  
    // Check if a JWT token is stored
    hasToken() {
      return !!this.getToken();
    }
  }
  
    // for user
    class UserManager  {
      constructor() {
        this.id = 'user_id';
        this.username = 'user_username';
        this.email = 'user_email';
        this.password = 'user_password';
        this.first_name = 'user_first_name';
        this.last_name = 'user_last_name';
        this.is_staff = 'user_is_staff';
        this.is_active = 'useris_active';
      }
  
      // Save the JWT token to local storage
      saveUser(user) {
        console.log(user);
        localStorage.setItem(this.id, user.id);
        localStorage.setItem(this.username, user.username);
        localStorage.setItem(this.email, user.email);
        localStorage.setItem(this.password, user.password);
        localStorage.setItem(this.first_name, user.first_name);
        localStorage.setItem(this.last_name, user.last_name);
        localStorage.setItem(this.is_staff, user.is_staff);
        localStorage.setItem(this.is_active, user.is_active);
      }
    
      // Retrieve the JWT token from local storage
      getUser() {
        const user = {
          "id": localStorage.getItem(this.id),
          "username": localStorage.getItem(this.username),
          "email": localStorage.getItem(this.email),
          "first_name" : localStorage.getItem(this.first_name),
          "last_name" : localStorage.getItem(this.last_name),
          "is_staff" : localStorage.getItem(this.is_staff),
          "is_active" : localStorage.getItem(this.is_active),     
        }
        return user;
      }
    
      // Clear the JWT token from local storage
      clearUser() {
        localStorage.removeItem(this.user);
      }
    
      // Check if a JWT token is stored
      hasUser() {
        return !!this.getUser();
      }
    }
  
    export {JwtTokenManager, UserManager};
   
    