module.exports = {
    apps: [{
        name: 'server',
        script: './src/server.js',
        instances: 0,
        exec_mode: 'cluster'
    }]
}