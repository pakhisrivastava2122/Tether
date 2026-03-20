# Instructions to run the application after Cloning:

## clone the project to your choice of loction
- ### in terminal run following commands:
    1. run: `cd tether-miniproj` \
    you entered the project directory.  
    2. To run backend we need to have python 3.9 installed in our system. after that we need to add dependencies in our project. **(if u dont have python 3.9 then install it first**). \
    *We are creating virtual environment for our project. skip if u already created.* \
    run: `py -3.9 -m venv .venv` \
    run: `.venv\Scripts\activate` \
    done. lets install dependencies now. 
    3. run: `pip install -r requirements_server.txt` \
    run: `pip install -r requirements_recognise.txt`\
    run: `uvicorn app.main:app --reload` \
    *Now your server is running*
    4. run: `cd ..` \
    to come out of server dir and getting inside frontend dir.\
    run: `cd frontend` \
    run: `npm install` \
    run: `npm run dev` \
    frontend must be running now.\
    *hit the link with ctrl pressed.*
    *create account and login. and use the appication.* 
    ***Thank You***





    

