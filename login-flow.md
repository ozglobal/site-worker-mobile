App Startup (Hydration)
sequenceDiagram
    participant User
    participant App
    participant AuthProvider
    participant localStorage

    User->>App: Open app
    App->>AuthProvider: mount()
    AuthProvider->>localStorage: read accessToken\nread refreshToken\nread expiresAt
    localStorage-->>AuthProvider: tokens
    alt tokens exist
        AuthProvider->>AuthProvider: restore token state
        AuthProvider->>AuthProvider: user = null
    else tokens missing
        AuthProvider->>AuthProvider: unauthenticated state
    end
    AuthProvider-->>App: app ready

Login Flow
sequenceDiagram
    participant User
    participant LoginPage
    participant API
    participant AuthProvider
    participant localStorage

    User->>LoginPage: Enter credentials
    LoginPage->>API: POST /auth/login
    API-->>LoginPage: accessToken\nrefreshToken\nexpiresIn\nworkerInfo
    LoginPage->>AuthProvider: login(payload)
    AuthProvider->>localStorage: store accessToken\nstore refreshToken\nstore expiresAt
    AuthProvider->>AuthProvider: set user (memory)
    AuthProvider-->>LoginPage: login success

Authenticated API Request
sequenceDiagram
    participant Component
    participant AuthProvider
    participant APIClient
    participant Backend

    Component->>AuthProvider: request accessToken
    AuthProvider-->>Component: accessToken
    Component->>APIClient: attach Authorization
    APIClient->>Backend: API request
    Backend-->>APIClient: response
    APIClient-->>Component: response

Token Expiry Check & Refresh
sequenceDiagram
    participant Component
    participant AuthProvider
    participant APIClient
    participant Backend
    participant localStorage

    Component->>AuthProvider: API request
    AuthProvider->>AuthProvider: check expiresAt
    alt token valid
        AuthProvider->>APIClient: proceed request
        APIClient->>Backend: API request
        Backend-->>APIClient: response
        APIClient-->>Component: response
    else token expired
        AuthProvider->>APIClient: POST /auth/refresh
        APIClient->>Backend: refreshToken
        Backend-->>APIClient: new accessToken\nexpiresIn
        APIClient-->>AuthProvider: refreshed token
        AuthProvider->>localStorage: update accessToken\nupdate expiresAt
        AuthProvider->>APIClient: retry original request
        APIClient->>Backend: API request
        Backend-->>APIClient: response
        APIClient-->>Component: response
    end

Refresh Failure → Logout
sequenceDiagram
    participant Component
    participant AuthProvider
    participant APIClient
    participant Backend
    participant localStorage

    Component->>AuthProvider: API request
    AuthProvider->>APIClient: POST /auth/refresh
    APIClient->>Backend: refreshToken
    Backend-->>APIClient: 401 / 403
    APIClient-->>AuthProvider: refresh failed
    AuthProvider->>localStorage: clear tokens
    AuthProvider->>AuthProvider: clear memory state
    AuthProvider-->>Component: logout + redirect

Logout Flow
sequenceDiagram
    participant User
    participant Component
    participant AuthProvider
    participant localStorage

    User->>Component: Click logout
    Component->>AuthProvider: logout()
    AuthProvider->>localStorage: clear all auth keys
    AuthProvider->>AuthProvider: clear memory state
    AuthProvider-->>Component: redirect to login

Role-Based Route Guard
sequenceDiagram
    participant User
    participant Router
    participant AuthProvider

    User->>Router: Navigate to route
    Router->>AuthProvider: check auth + role
    AuthProvider-->>Router: allow / deny
    alt allowed
        Router-->>User: render page
    else denied
        Router-->>User: redirect
    end
