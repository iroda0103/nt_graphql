import { readFileSync } from 'fs';
import { join } from 'path';
import { pubsub } from '../../graphql/pubsub.js';
import { addUser } from './add-user.js';
import { listUsers } from './list-users.js';
import { showUser } from './show-user.js';
import { editUser } from './edit-user.js';
import { removeUser } from './remove-user.js';
import { listPosts } from '../posts/list-posts.js';
import { loginUser } from './login-user.js';
import { isLoggedIn } from '../../graphql/is-loggedin.js';

const typeDefs = readFileSync(
  join(process.cwd(), 'src', 'modules', 'users', '_schema.gql'),
  'utf8'
);

const resolvers = {
  Query: {
    users: (_, __, contextValue) => {
      isLoggedIn(contextValue);
      return listUsers();
    },
    user: (_, args) => {
      return showUser({ id: args.id });
    },
    me: (_, __, contextValue) => {
      isLoggedIn(contextValue);
      return showUser({ id: contextValue.user.id });
    },
  },
  Mutation: {
    createUser: async (_, args) => {
      const result = await addUser(args.input);

      pubsub.publish('USER_CREATED', { userCreated: result });

      return result;
    },
    updateUser: (_, args, contextValue) => {
      isLoggedIn(contextValue);
      if (contextValue.user.id !== args.id) {
        throw new Error('Forbidden');
      }

      return editUser({ id: args.id, ...args.input });
    },
    removeUser: (_, args) => {
      return removeUser({ id: args.id });
    },
    login: (_, args) => {
      return loginUser(args.input);
    },
  },
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator(['USER_CREATED']),
    },
  },
  User: {
    posts: (parent) => {
      return listPosts({ user_id: parent.id });
    },
  },
};

export default { typeDefs, resolvers };
