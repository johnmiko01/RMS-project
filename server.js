require('dotenv').config();
const express = require('express');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const knex = require("./dbconnection")
const app = express();
const PORT = process.env.PORT || 3000;

const initializePassport = require('./passport-config');

initializePassport(
        passport,
        async (username) => {
                const userFound = await knex('admin.users').where({ user_name: username }).first();
                console.log(userFound);
                return userFound;
        },
        async (id) => {
                const userFound = await knex('admin.users').where({ user_id: id }).first();
                console.log('this is id', userFound);
                return userFound;
        }
);

// set template engine
app.set('view engine', 'ejs');

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(
        session({
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: false,
        })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static('public'));

// route prefix
app.use('', require('./routes/routes'));

app.listen(PORT, () => {
        console.log(`Server is running in http://localhost:${PORT}`);
});
