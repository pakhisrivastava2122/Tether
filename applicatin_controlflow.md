
```mermaid

---
config:
  theme: default
  look: neo
---
flowchart TD
A[Start: User Loads App] --> B{Token in localStorage?};
subgraph Phase_1_Authentication
    direction TB
    B -- No --> C[Show Login or Sign Up Page];
    C -- User Signs Up --> D[POST /api/auth/signup];
    D --> E[Backend: Validate, Hash, Save User, Create JWT];
    E --> F[Return 200 OK - Token and User];
    C -- User Logs In --> G[POST /api/auth/login];
    G --> H[Backend: Find User, Verify Password, Create JWT];
    H --> F;
end
F --> I[App: Save Token and User to localStorage];
B -- Yes --> K[App: Get Token and User from localStorage];
K --> L[Fetch User Status GET /api/auth/me/status];
L --> I;
I --> J[App: Set Page home];
subgraph Phase_2_Main_Application
    direction TB
    J --> M[Show Home Page with Header];
    M --> N[User Clicks File Report];
    M --> O[User Clicks Profile Icon];
    M --> P[User Clicks Logout];
end
P --> C; 
O --> Q[Show Profile Page - Update Details - Change Password];
Q --> Q;
Q --> J;
subgraph Phase_3_Report_AI_Match
    direction TB
    N --> R[User Fills Report Form with Photo];
    R --> S[POST /api/report with Auth Token];
    S --> T[Backend: Get user_id - Save Image];
    T --> U[Backend: Generate Face Embedding];
    U --> V[Backend: Save Report to Submissions Collection];
    V --> W[Backend: Search Opposite DB for Match];
    W --> X{Match Found?};
    X -- No --> Y[API Response - match_found false];
    Y --> Z[Show Submitted Message];
    Z --> J;
    X -- Yes --> AA[Backend: Update Both Reports with Unconfirmed Match];
    AA --> BB[API Response - match_found true];
    BB --> CC[Show Match Page];
end
subgraph Phase_4_Match_Confirmation
    direction TB
    CC --> DD[Show Match Confirmation Page];
    DD --> EE[GET /api/match ID];
    EE --> FF[Backend: Fetch Both Reports Details];
    FF --> GG[Show Both Photos and Details];
    GG --> HH{User Confirms?};
    HH -- Yes --> II[POST /api/confirm];
    II --> JJ[Backend: Set Confirmed true];
    JJ --> JJJ[Backend: Save Final Child Record];
    JJJ --> KK[App: confirmedMatch true];
    KK --> J;
    HH -- No --> LL[POST /api/reject];
    LL --> MM[Backend: Clear Match Info];
    MM --> J;
end
classDef frontend fill:#E0F7FA,stroke:#006064,stroke-width:2px;
classDef backend fill:#FFF9C4,stroke:#F57F17,stroke-width:2px;
classDef db fill:#FBE9E7,stroke:#BF360C,stroke-width:2px;
class A,C,I,J,K,L,M,N,O,P,Q,R,Z,CC,DD,GG,KK frontend;
class D,G,EE,II,LL backend;
class E,H,T,U,V,W,AA,FF,JJ,JJJ,MM db;
