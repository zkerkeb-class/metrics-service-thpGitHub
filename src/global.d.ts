// Pour les modules sans définitions de types
declare module "node-cron";
declare module "winston";

// Déclaration complète pour discord.js
declare module "discord.js" {
  export class WebhookClient {
    constructor(options: { id: string; token: string });
    send(options: any): Promise<any>;
  }

  export class EmbedBuilder {
    constructor();
    setTitle(title: string): this;
    setDescription(description: string): this;
    setColor(color: number): this;
    setTimestamp(): this;
    addFields(...fields: Array<{ name: string; value: string }>): this;
  }
}

// Pour les fonctions globales que TypeScript ne reconnaît pas en attendant l'installation des types
declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void; 