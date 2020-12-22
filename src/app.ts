import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import * as express from "express";
import bodyParser from "body-parser";
import { container } from "./ioc/container";
import Bootstrap from "./ioc/bootstrap";
import * as swagger from "swagger-express-ts";
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import http from "http";
import { port } from "./config";
import { EventContext } from './component/chian_event';

export class DexQueryApiServer {
  
  private server: http.Server;

  async run(): Promise<void> {
    const bootstrap = new Bootstrap();
    await bootstrap.bootstrap();

    const app = await this.buildApplication();
    this.server = http.createServer(app);    
    EventContext.init(this.server);
    
    this.server.listen(port);
  }

  async buildApplication(): Promise<express.Application> {
    const server = new InversifyExpressServer(container);
    server.setConfig((app) => {
      app.use(helmet({ contentSecurityPolicy: false }));
      app.use(cors());
      app.use(
        bodyParser.urlencoded({
          extended: true,
        })
      );
      app.use(bodyParser.json());

      app.use("/api-docs/swagger", express.static("swagger"));
      app.use(
        "/api-docs/swagger/assets",
        express.static("node_modules/swagger-ui-dist")
      );
      app.use(
        swagger.express({
          definition: {
            info: {
              title: "DEX-QUERY-API",
              version: "1.0",
            },
            externalDocs: {
              url: "https://ckb-dex.netlify.app/",
            },
            // Models can be defined here
          },
        })
      );
      
      app.use(morgan('short'));
      app.use("/index.html", express.static("index.html"));
    });

    const serverInstance = server.build();
    return serverInstance;
  }
}

const dexQueryApiServer: DexQueryApiServer = new DexQueryApiServer();
dexQueryApiServer.run();
