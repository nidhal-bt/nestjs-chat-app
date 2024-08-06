export interface Config {
  port: string;
  bcryptSaltOrRound: string | number;
  jwtSecret: string;
  resendApiKey: string;
  clienUrl: string;
}
