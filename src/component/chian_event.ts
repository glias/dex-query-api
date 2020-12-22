import { Server, Socket } from 'socket.io';
import http from "http";
import { container, modules } from '../ioc';
import IndexerWrapper from '../modules/indexer/indexer';
import { QueryOptions } from 'winston';
import { Mutex } from 'async-mutex';

export class EventContext {
    private static io: Server;
  
    static init(httpServer: http.Server): void {
      const io = new Server(httpServer);
      this.io = io;
      EventContext.connection();
    }
  
    static connection(): void {
      const indexer: IndexerWrapper = container.get(modules[IndexerWrapper.name]);
      this.io.on('connection', function(socket: Socket) {
        socket.on('dex-event', function(msg) {
          try {      
            const event = new CkbBalanceEvent(indexer, JSON.parse(msg), socket)
            event.subscribe();
          } catch (error) {
            console.error(error);
          }
  
        });  
      });
  
    }
  
}

export interface DexEvent {
    subscribe(): Promise<void>;
    sendChange(): void;
}


export class CkbBalanceEvent implements DexEvent {
    private indexer: IndexerWrapper; 
    private eventKey: QueryOptions;
    private socket: Socket;
    private blockNumber = 0;
    private mutex = new Mutex();
  
    constructor(
      indexer: IndexerWrapper,
      eventKey: QueryOptions,
      socket: Socket,
    ) {
      this.indexer = indexer;
      this.eventKey = eventKey;
      this.socket = socket;
      this.indexer.tip().then(res => {
        this.blockNumber = res;
      });
      
    }



    async sendChange(): Promise<void> {
      // link https://github.com/DirtyHairy/async-mutex
      const release = await this.mutex.acquire();
      try {
        const blockNumber = await this.indexer.tip();
        if(this.blockNumber === blockNumber) {
          return;
        }

        this.blockNumber = blockNumber;
        
        this.socket.emit("order-change", blockNumber);  
      } finally {
        release();
      }
    }

    async subscribe(): Promise<void> {
      this.indexer.subscribe(this.eventKey, this);
    }
  
}