import { Construct } from 'constructs';
import { aws_appsync as appsync, Stack } from 'aws-cdk-lib';
import { Cognitos } from './cognitos';
import { DynamoDbTables } from './dynamodb-tables';
import { IamRoles } from './iam-roles';
import { readFileSync } from 'fs';

export interface AppSyncsProps {
  cognitos: Cognitos;
  dynamoDbTables: DynamoDbTables;
  iamRoles: IamRoles;
  region: string;
  stackName: string;
}

export class AppSyncs extends Construct {
  public readonly graphQLSchema: string;
  public readonly videoApi: appsync.CfnGraphQLApi;
  public readonly videoApiGraphQLSchema: appsync.CfnGraphQLSchema;
  public readonly dataSource: appsync.CfnDataSource;
  public readonly mutationDeleteVideoRequest: string;
  public readonly mutationDeleteVideoResponse: string;
  public readonly mutationDeleteVideoResolver: appsync.CfnResolver;
  public readonly mutationUpdateVideoRequest: string;
  public readonly mutationUpdateVideoResponse: string;
  public readonly mutationUpdateVideoResolver: appsync.CfnResolver;
  public readonly queryGetVideoRequest: string;
  public readonly queryGetVideoResponse: string;
  public readonly queryGetVideoResolver: appsync.CfnResolver;
  public readonly queryGetVideosByTagRequest: string;
  public readonly queryGetVideosByTagResponse: string;
  public readonly queryGetVideosByTagResolver: appsync.CfnResolver;
  public readonly queryListVideosRequest: string;
  public readonly queryListVideosResponse: string;
  public readonly queryListVideosResolver: appsync.CfnResolver;

  constructor(scope: Stack, id: string, props: AppSyncsProps) {
    super(scope, id);

    this.graphQLSchema = readFileSync('./lib/appsync/schema.graphql', 'utf-8');

    this.videoApi = new appsync.CfnGraphQLApi(this, 'VideoApi', {
      name: `${props.stackName}-GraphQL-API`,
      authenticationType: 'AWS_IAM',
      userPoolConfig: {
        awsRegion: props.region,
        userPoolId: props.cognitos.userPool.userPoolId,
        defaultAction: 'ALLOW',
      },
    });

    this.videoApiGraphQLSchema = new appsync.CfnGraphQLSchema(
      this,
      'GraphQLSchema',
      {
        apiId: this.videoApi.attrApiId,
        definition: this.graphQLSchema,
      }
    );

    this.dataSource = new appsync.CfnDataSource(this, 'DynamoDbDataSource', {
      apiId: this.videoApi.attrApiId,
      description: `${props.stackName} AppSync DynamoDB Data Source`,
      name: `${props.stackName.replace('-', '_')}_DynamoDB_DataSource`,
      dynamoDbConfig: {
        tableName:
          props.dynamoDbTables.videoInfo.tableName ??
          `${props.stackName}-VideoInfo`,
        awsRegion: props.region,
      },
      type: 'AMAZON_DYNAMODB',
      serviceRoleArn: props.iamRoles.appSync.roleArn, // This is what we configured above
    });

    this.dataSource.addDependsOn(this.videoApiGraphQLSchema);

    this.mutationDeleteVideoRequest = readFileSync(
      './lib/appsync/resolvers/mutations/deleteVideo/request.vtl',
      'utf-8'
    );

    this.mutationDeleteVideoResponse = readFileSync(
      './lib/appsync/resolvers/mutations/deleteVideo/response.vtl',
      'utf-8'
    );

    this.mutationDeleteVideoResolver = new appsync.CfnResolver(
      this,
      'MutationDeleteVideoResolver',
      {
        apiId: this.videoApi.attrApiId,
        typeName: 'Mutation',
        fieldName: 'deleteVideo',
        dataSourceName: `${props.stackName.replace(
          '-',
          '_'
        )}_DynamoDB_DataSource`,
        requestMappingTemplate: this.mutationDeleteVideoRequest,
        responseMappingTemplate: this.mutationDeleteVideoResponse,
      }
    );

    this.mutationDeleteVideoResolver.addDependsOn(this.videoApiGraphQLSchema);

    this.mutationDeleteVideoResolver.addDependsOn(this.dataSource);

    this.mutationUpdateVideoRequest = readFileSync(
      './lib/appsync/resolvers/mutations/updateVideo/request.vtl',
      'utf-8'
    );

    this.mutationUpdateVideoResponse = readFileSync(
      './lib/appsync/resolvers/mutations/updateVideo/response.vtl',
      'utf-8'
    );

    this.mutationUpdateVideoResolver = new appsync.CfnResolver(
      this,
      'MutationUpdateVideoResolver',
      {
        apiId: this.videoApi.attrApiId,
        typeName: 'Mutation',
        fieldName: 'updateVideo',
        dataSourceName: `${props.stackName.replace(
          '-',
          '_'
        )}_DynamoDB_DataSource`,
        requestMappingTemplate: this.mutationUpdateVideoRequest,
        responseMappingTemplate: this.mutationUpdateVideoResponse,
      }
    );

    this.mutationUpdateVideoResolver.addDependsOn(this.videoApiGraphQLSchema);

    this.mutationUpdateVideoResolver.addDependsOn(this.dataSource);

    this.queryGetVideoRequest = readFileSync(
      './lib/appsync/resolvers/queries/getVideo/request.vtl',
      'utf-8'
    );

    this.queryGetVideoResponse = readFileSync(
      './lib/appsync/resolvers/queries/getVideo/response.vtl',
      'utf-8'
    );

    this.queryGetVideoResolver = new appsync.CfnResolver(
      this,
      'QueryGetVideoResolver',
      {
        apiId: this.videoApi.attrApiId,
        typeName: 'Query',
        fieldName: 'getVideo',
        dataSourceName: `${props.stackName.replace(
          '-',
          '_'
        )}_DynamoDB_DataSource`,
        requestMappingTemplate: this.queryGetVideoRequest,
        responseMappingTemplate: this.queryGetVideoResponse,
      }
    );

    this.queryGetVideoResolver.addDependsOn(this.videoApiGraphQLSchema);

    this.queryGetVideoResolver.addDependsOn(this.dataSource);

    this.queryGetVideosByTagRequest = readFileSync(
      './lib/appsync/resolvers/queries/getVideosByTag/request.vtl',
      'utf-8'
    );

    this.queryGetVideosByTagResponse = readFileSync(
      './lib/appsync/resolvers/queries/getVideosByTag/response.vtl',
      'utf-8'
    );

    this.queryGetVideosByTagResolver = new appsync.CfnResolver(
      this,
      'QueryGetVideosByTagResolver',
      {
        apiId: this.videoApi.attrApiId,
        typeName: 'Query',
        fieldName: 'getVideosByTag',
        dataSourceName: `${props.stackName.replace(
          '-',
          '_'
        )}_DynamoDB_DataSource`,
        requestMappingTemplate: this.queryGetVideosByTagRequest,
        responseMappingTemplate: this.queryGetVideosByTagResponse,
      }
    );

    this.queryGetVideosByTagResolver.addDependsOn(this.videoApiGraphQLSchema);

    this.queryGetVideosByTagResolver.addDependsOn(this.dataSource);

    this.queryListVideosRequest = readFileSync(
      './lib/appsync/resolvers/queries/listVideos/request.vtl',
      'utf-8'
    );

    this.queryListVideosResponse = readFileSync(
      './lib/appsync/resolvers/queries/listVideos/response.vtl',
      'utf-8'
    );

    this.queryListVideosResolver = new appsync.CfnResolver(
      this,
      'QueryListVideosResolver',
      {
        apiId: this.videoApi.attrApiId,
        typeName: 'Query',
        fieldName: 'listVideos',
        dataSourceName: `${props.stackName.replace(
          '-',
          '_'
        )}_DynamoDB_DataSource`,
        requestMappingTemplate: this.queryListVideosRequest,
        responseMappingTemplate: this.queryListVideosResponse,
      }
    );

    this.queryListVideosResolver.addDependsOn(this.videoApiGraphQLSchema);

    this.queryListVideosResolver.addDependsOn(this.dataSource);
  }
}
