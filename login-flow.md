App Startup (Hydration)
sequenceDiagram
    participant User
    participant App
    participant AuthProvider
    participant Memory as In-Memory (auth.ts)
    participant localStorage

    User->>App: Open app
    App->>AuthProvider: mount()
    AuthProvider->>localStorage: read refreshToken, expiresIn, issuedAt
    localStorage-->>AuthProvider: auth metadata
    alt refreshToken exists
        AuthProvider->>API: POST /auth/refresh (X-Refresh-Token header)
        API-->>AuthProvider: new accessToken, refreshToken, expiresIn
        AuthProvider->>Memory: store accessToken (in-memory only)
        AuthProvider->>localStorage: update refreshToken, expiresIn, issuedAt
        AuthProvider->>API: GET /auth/user/info
        API-->>AuthProvider: workerInfo
        AuthProvider->>Memory: store workerInfo (in-memory only)
    else refreshToken missing
        AuthProvider->>AuthProvider: unauthenticated → redirect to login
    end
    AuthProvider-->>App: app ready

Login Flow
sequenceDiagram
    participant User
    participant LoginPage
    participant API
    participant Memory as In-Memory (auth.ts)
    participant localStorage

    User->>LoginPage: Enter credentials
    LoginPage->>API: POST /auth/login
    API-->>LoginPage: accessToken, refreshToken, expiresIn, workerInfo
    LoginPage->>Memory: store accessToken (in-memory only)
    LoginPage->>Memory: store workerInfo (in-memory only)
    LoginPage->>localStorage: store refreshToken, expiresIn, issuedAt
    LoginPage-->>User: redirect to home

Authenticated API Request
sequenceDiagram
    participant Component
    participant authFetch
    participant Memory as In-Memory (auth.ts)
    participant Backend

    Component->>authFetch: request(url, options)
    authFetch->>Memory: getAccessToken()
    Memory-->>authFetch: accessToken
    authFetch->>authFetch: check isTokenExpired()
    alt token valid
        authFetch->>Backend: API request (Authorization: Bearer token)
        Backend-->>authFetch: response
        authFetch-->>Component: response
    else token expired
        authFetch->>authFetch: refreshAccessToken() (see below)
        authFetch->>Backend: retry with new token
        Backend-->>authFetch: response
        authFetch-->>Component: response
    end

Token Refresh (deduplicated)
sequenceDiagram
    participant authFetch
    participant refreshAccessToken
    participant Memory as In-Memory (auth.ts)
    participant localStorage
    participant Backend

    authFetch->>refreshAccessToken: call
    refreshAccessToken->>refreshAccessToken: check refreshInFlight (dedup)
    alt already in-flight
        refreshAccessToken-->>authFetch: return existing promise
    else new request
        refreshAccessToken->>localStorage: getRefreshToken()
        localStorage-->>refreshAccessToken: refreshToken
        refreshAccessToken->>Backend: POST /auth/refresh (X-Refresh-Token header)
        Backend-->>refreshAccessToken: new accessToken, refreshToken, expiresIn
        refreshAccessToken->>Memory: store new accessToken
        refreshAccessToken->>localStorage: update refreshToken, expiresIn, issuedAt
        refreshAccessToken-->>authFetch: new accessToken
    end

Refresh Failure → Logout
sequenceDiagram
    participant Component
    participant authFetch
    participant Backend
    participant Memory as In-Memory (auth.ts)
    participant localStorage

    Component->>authFetch: API request
    authFetch->>Backend: POST /auth/refresh
    Backend-->>authFetch: 401 / network error
    authFetch->>reportError: AUTH_SESSION_EXPIRED
    authFetch->>Memory: clear accessToken, workerInfo
    authFetch->>localStorage: clear auth data
    authFetch-->>Component: redirect to /login

Logout Flow
sequenceDiagram
    participant User
    participant Component
    participant handleLogout
    participant Memory as In-Memory (auth.ts)
    participant localStorage
    participant IndexedDB

    User->>Component: Click logout
    Component->>handleLogout: call
    handleLogout->>localStorage: clear auth data
    handleLogout->>IndexedDB: clear file storage
    handleLogout->>Memory: (cleared on page reload)
    handleLogout-->>Component: redirect to /login
