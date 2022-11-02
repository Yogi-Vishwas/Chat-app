import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'chatDb',
  connector: 'postgresql',
  url: 'postgres://postgres:leomessi@localhost/chatDb',
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'leomessi',
  database: 'chatDb',
  schema: process.env.DB_SCHEMA,
};

@lifeCycleObserver('datasource')
export class ChatDbDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'chatDb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.chatDb', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
