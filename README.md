<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Roles y propiedad de los cursos

Los usuarios tienen uno de estos tres roles: `admin`, `teacher` o `student`. Al registrarse, el usuario obtiene siempre el rol de `student`; la asignación de un rol distinto debe realizarse mediante un proceso administrativo autorizado. Los tokens de inicio de sesión incluyen el rol del usuario.

Al crear un curso, el sistema registra al usuario autenticado como su propietario. Los profesores pueden modificar sus propios cursos, los administradores pueden modificar cualquier curso y solo los administradores pueden eliminar cursos. Es posible que algunos cursos existentes no tengan un propietario; en tales casos, solo un administrador puede modificarlos.

La columna de rol tiene como valor predeterminado `student`, y la relación de propiedad de un curso admite valores nulos (`nullable`) para preservar los registros de cursos ya existentes. La sincronización del esquema mediante TypeORM solo está habilitada en el entorno de desarrollo; en el entorno de producción, es necesario realizar una migración de la base de datos para añadir la columna de tipo enumerado `users.role` y la clave foránea `courses.createdByUserId` (que permite valores nulos) antes de implementar este cambio.

## CORS, límites de solicitudes y seguridad de transporte

CORS permite que los clientes web autorizados lean respuestas desde el navegador; no es un mecanismo de autorización. JWT y los guards de roles siguen protegiendo las rutas sin importar el origen. Configura `CORS_ORIGINS` con una lista separada por comas de orígenes exactos, sin rutas ni barras finales. En desarrollo el valor predeterminado es `http://localhost:5173`.

La API limita las solicitudes a 20 por minuto por cliente y `POST /auth/login` a cinco por minuto. Al superar el límite, responde `429 Too Many Requests`. 

En producción, todo el tráfico debe usar HTTPS. TLS puede terminar en un proxy, balanceador o plataforma de alojamiento de confianza; en desarrollo local se permite `http://localhost`. 

## Registro y manejo de errores HTTP

El middleware registra método, ruta sin query string, estado y duración; no registra headers, credenciales ni cuerpos de solicitud. El interceptor global mide la duración del handler y no intercepta ni oculta errores. El filtro global devuelve `statusCode`, `path`, `timestamp` y `message`; los errores inesperados responden con un mensaje genérico, mientras que los detalles internos se limitan a un registro controlado del tipo de excepción, método, ruta y estado. Los IDs de curso se validan con `ParseIntPipe` y el `ValidationPipe` global conserva la validación de cuerpos y consultas.

## Pruebas

Ejecuta el conjunto unitario del caso de uso de actualización con:

```bash
npm test -- update-course
```

Las pruebas usan Arrange/Act/Assert y un repositorio falso de cursos. Cubren la actualización exitosa del propietario docente, el rechazo de otro docente, el acceso administrativo y el recurso inexistente; nunca se abre una conexión real a PostgreSQL.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
