import express from'express';
import routes from'./routes';




class App{
    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
    }
    //permite trabalhar com mkais facilidade com json 
    middlewares(){
        this.server.use(express.json());
    }
    routes(){
        this.server.use(routes);
    }
    
}

//instancia o servidor
export default new App().server;

