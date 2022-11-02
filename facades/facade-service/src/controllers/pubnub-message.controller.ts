import {inject} from '@loopback/core';
import {CountSchema, Filter, Where} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  post,
  requestBody,
  patch,
  getWhereSchemaFor,
} from '@loopback/rest';
import {
  authenticate,
  AuthenticationBindings,
  STRATEGY,
} from 'loopback4-authentication';
import {PubnubMessage} from '../models/pubnub-message.model';
import {
  CONTENT_TYPE,
  IAuthUserWithPermissions,
  OPERATION_SECURITY_SPEC,
  STATUS_CODE,
} from '@sourceloop/core';
import {Messageservice} from '../services/messageservice.service';
import {PubnubMessageRecipient} from '../models/pubnub-message-recipient.model';
import {authorize} from 'loopback4-authorization';
import {Notificationservice} from '../services/notif.service';
import {Pubnubnotification} from '../models/pubnubnotification';

export class PubnubMessageController {
  constructor(
    @inject('services.Messageservice')
    private readonly messageService: Messageservice,
    @inject('services.Notificationservice')
    private readonly notifService: Notificationservice,
  ) {}

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: ['*']})
  @get('/messages', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Array of Message model instances',
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {
              type: 'array',
              items: getModelSchemaRef(PubnubMessage, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER) user: IAuthUserWithPermissions,
    @param.header.string('Authorization') token: string,
    @param.query.string('ChannelID') channelID?: string,
    @param.filter(PubnubMessage) filter?: Filter<PubnubMessage>,
  ): Promise<PubnubMessage[]> {
    const filter1: Filter<PubnubMessage> = {
      where: {
        channelId: channelID,
      },
      order: ['createdOn ASC'],
    };
    return this.messageService.getMessage(token, filter1);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: ['*']})
  @post('/messages', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Message model instance',
        content: {
          [CONTENT_TYPE.JSON]: {schema: getModelSchemaRef(PubnubMessage)},
        },
      },
    },
  })
  async create(
    @param.header.string('Authorization') token: string,
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(PubnubMessage, {
            title: 'Message',
            exclude: ['id'],
          }),
        },
      },
    })
    message: PubnubMessage,
  ): Promise<PubnubMessage> {
    message.channelId = message.channelId ?? message.toUserId;
    const msg = await this.messageService.createMessage(message, token);
    const msgrecipient = new PubnubMessageRecipient({
      channelId: message.channelId,
      recipientId: message.toUserId ?? message.channelId,
      messageId: msg.id,
    });

    await this.messageService.createMessageRecipients(msgrecipient, token);

    const notif = new Pubnubnotification({
      subject: message.subject,
      body: message.body,
      type: 0,
      receiver: {
        to: [
          {
            type: 0,
            id: message.channelId,
          },
        ],
      },
    });
    console.log(notif);

    await this.notifService.createNotification(notif, token);

    return msg;
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: ['*']})
  @patch(`messages/{messageid}/markAsRead`, {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        description: 'Message PATCH success count',
        content: {[CONTENT_TYPE.JSON]: {schema: CountSchema}},
      },
    },
  })
  async patchMessageRecipients(
    @param.header.string('Authorization') token: string,
    @param.path.string('messageid') msgId: string,
    @requestBody({
      content: {
        [CONTENT_TYPE.JSON]: {
          schema: getModelSchemaRef(PubnubMessageRecipient, {partial: true}),
        },
      },
    })
    messageRecipient: Partial<PubnubMessageRecipient>,
    @param.query.object('where', getWhereSchemaFor(PubnubMessageRecipient))
    where?: Where<PubnubMessageRecipient>,
  ): Promise<PubnubMessageRecipient> {
    const patched = {
      isRead: true,
    };

    return this.messageService.updateMsgRecipients(msgId, patched, token);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: ['*']})
  @get('/userTenantId', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        description: 'To get the userTenantId',
        content: {
          [CONTENT_TYPE.TEXT]: {
            type: 'string',
          },
        },
      },
    },
  })
  async me(
    @inject(AuthenticationBindings.CURRENT_USER) user: IAuthUserWithPermissions,
    @param.header.string('Authorization') token: string,
  ): Promise<string> {
    console.log(user);
    console.log(token);
    if (user.userTenantId) {
      return user.userTenantId;
    } else {
      return '';
    }
  }
}
