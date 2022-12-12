<h1>Food Reserve API</h1>
<p>This API made for university food system and use Node.js, Express.js, MongoDB, JWT and more... </p><hr/>
<h2>Guide</h2>
<p>There is no Frontend and UI to work with this API.so you must use appllications like postman to work with this project !</p>
first execute below command to install all package needed:<br/>
<pre>npm install</pre>
Then make sure you have installed MongoDB on your system and mongod service is running then run project with this command:<br/>
<pre>node index</pre>
Web server start running on <a href="http://localhost:3000">localserver and port 3000</a> by default.you can change the port in .env file.use below endpoints to  with web server:<br/> <br/>
<b><i>Endpoints</i></b>:
<ul>
    <li><a href="#login">Login = GET /api/user</a></li>
    <li><a href="#signup">Signup = POST /api/user</a></li>
    <li><a href="#edit">Edit User = PUT /api/user</a></li>
    <li><a href="#increase-currency">Increase Currency = POST /api/user/increase-currency</a></li>
    <li><a href="#getFoods">Get Foods = GET /api/food</a></li>
    <li><a href="#createFood">Create Food = POST /api/food</a></li>
    <li><a href="#deleteFood">Delete Food = DELETE /api/food</a></li>
    <li><a href="#reserveFood">Reserve Food = POST /api/food/reserve</a></li>
</ul>

<section id="login">
<h1>Login</h1>
<p>Method = GET<br/>Route = /api/user<br/>Pass these as query string in URL</p>
    <ul>
        <li>username : string</li>
        <li>password : string</li>
    </ul>
</section>

<section id="signup">
<h1>Signup</h1>
<p>Method = POST<br/>Route = /api/user<br/>Pass these in body as JSON</p>
    <ul>
        <li>fullname : string</li>
        <li>password : string</li>
    </ul>
</section>

<section id="edit">
<h1>Edit User</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = PUT<br/>Route = /api/user<br/>Pass these in body as JSON</p>
    <ul>
    <li>type : integer - range[0,5]</li>
    <li>type = 0 => Update food code password
        <ul>
            <li>newCode : integer</li>
        </ul>
    </li>
    <li>type = 1 => Update username
        <ul>
            <li>newUsername : string</li>
        </ul>
    </li>
    <li>type = 2 => Update password
        <ul>
            <li>newPassword : string</li>
        </ul>
    </li>
    <li>type = 3 => Update email
        <ul>
            <li>newEmail : string</li>
        </ul>
    </li>
    <li>type = 4 => Promote user(admin)
        <ul>
            <li>targetUser : string</li>
        </ul>
    </li>
    <li>type = 5 => Demote user(admin)
        <ul>
            <li>targetUser : string</li>
        </ul>
    </li>
    </ul>
</section>

<section id="increase-currency">
<h1>Increase Currency</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = POST<br/>Route = /api/user/increase-currency<br/>Pass these in body as JSON</p>
    <ul>
        <li>amount : integer</li>
    </ul>
</section>

<section id="getFoods">
<h1>Get Foods</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = GET<br/>Route = /api/food<br/>Pass these as query string in URL</p>
    <ul>
        <li>year : integer</li>
        <li>month : integer</li>
        <li>day : integer</li>
    </ul>
</section>

<section id="createFood">
<h1>Create Foods</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = POST<br/>Route = /api/food<br/>Pass these in body as JSON</p>
    <ul>
        <li>name : string</li>
        <li>meal : integer range[1,5]</li>
        <li>price : integer</li>
        <li>locations : string[]</li>
        <li>year : integer</li>
        <li>month : integer</li>
        <li>day : integer</li>
        <li>hour : integer</li>
        <li>minute : integer</li>
    </ul>
</section>

<section id="deleteFood">
<h1>Delete Foods</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = DELETE<br/>Route = /api/food<br/>Pass these in body as JSON</p>
    <ul>
        <li>id : string</li>
    </ul>
</section>

<section id="reserveFood">
<h1>Reserve Foods</h1>
<i><b>***login needed</b></i><br/><br/>
<p>Method = POST<br/>Route = /api/food/reserve<br/>Pass these in body as JSON</p>
    <ul>
        <li>id : string</li>
        <li>amount : integer</li>
        <li>location : string</li>
    </ul>
</section>