class IndexController {
    getHome(req, res) {
        res.send('Welcome to the homepage!');
    }

    // Additional methods can be added here for handling other requests
}

module.exports = IndexController;