# gRPC com Load Balancer no Kubernetes

## Contexto & Problema

![Headless Service](/imgs/Cenario%20Atual.png)

O **gRPC** é um framework de chamada de procedimento remoto de alto desempenho, open-source, desenvolvido pela Google. Ele utiliza o protocolo HTTP/2 para transporte, proporcionando várias vantagens sobre o HTTP/1.1, como multiplexação de conexões e comunicação bidirecional. Esse framework permite que clientes e servidores em diferentes ambientes de linguagem de programação possam se comunicar de forma eficiente, usando arquivos de definição de serviço (arquivos .proto) para definir a estrutura das mensagens e os métodos que podem ser chamados remotamente.

O gRPC, por padrão, não fornece um mecanismo nativo de load balancing totalmente funcional. Em um ambiente onde o servidor gRPC está escalado em múltiplos pods, como no Kubernetes, o load balancing se torna um desafio devido às seguintes razões:

 - **Distribuição de Carga**: O gRPC depende do DNS para resolver os endereços dos servidores. Isso significa que, por padrão, ele faz a resolução do DNS apenas uma vez no início e não reequilibra as conexões existentes dinamicamente.

 - **Conexões Persistentes**: O HTTP/2 mantém conexões persistentes e multiplexadas. Uma vez estabelecida, uma conexão HTTP/2 tende a permanecer ativa, o que pode levar a um desequilíbrio de carga se novas conexões não forem distribuídas uniformemente entre os pods.


## Possíveis soluções

### Headless Service

![Headless Service](/imgs/Headless%20Service.png)

Um Headless Service no Kubernetes é um tipo especial de serviço que não possui um endereço IP fixo associado a ele. Ao contrário dos serviços tradicionais, onde o Kubernetes atribui um IP ClusterIP que é usado para rotear o tráfego para os pods, um Headless Service permite a resolução de DNS diretamente para os endereços IP dos pods que estão associados ao serviço.

 - **Resolução de DNS Direta**: Quando um Headless Service é criado, o Kubernetes configura um nome de DNS para ele. No entanto, em vez de retornar um único IP do serviço, o DNS retorna os endereços IP dos pods diretamente. Isso permite que o cliente se conecte diretamente aos pods, sem passar por um proxy de serviço.

 - **ClusterIP**: Um Headless Service é criado com o campo clusterIP definido como None. Isso indica ao Kubernetes que ele não deve atribuir um IP ClusterIP para o serviço.

 - **Seletores de Pod**: Semelhante a outros tipos de serviços, um Headless Service ainda pode usar seletores para associar pods específicos com o serviço. No entanto, a resolução DNS retornará os IPs dos pods em vez do IP do serviço.

 Dessa forma, em cenários onde o cliente gRPC precisa resolver diretamente os endereços dos pods para implementar seu próprio mecanismo de balanceamento de carga. Isso é útil em ambientes onde se utiliza um resolver customizado ou bibliotecas como grpc-go que podem usar a lista de pods para distribuir as conexões.

**Node**
 ```node
 const options = {
    "grpc.service_config": JSON.stringify({
      loadBalancingConfig: [{ round_robin: {} }],
    }),
  };

const client = new Client(destination, credentials, options);
```

**Java**
 ```java
    Channel channel = ManagedChannelBuilder
        .forTarget(target)
        .defaultLoadBalancingPolicy("round_robin")
        .usePlaintext()
        .build();
```

### Service Mesh

![Service Mesh](/imgs/Service%20Mesh.png)

Service Mesh é uma camada de infraestrutura configurada para gerenciar a comunicação entre microserviços em uma arquitetura distribuída. Ela abstrai a complexidade do gerenciamento de redes de microserviços, fornecendo recursos para roteamento de tráfego, observabilidade, segurança e resiliência.

Istio é um service mesh open-source que facilita a gestão, segurança, e observabilidade de microserviços. Ele foi desenvolvido inicialmente pela Google, IBM e Lyft, e se tornou uma das soluções mais populares para gerenciar a comunicação entre serviços em ambientes de contêineres, especialmente no Kubernetes.

 - **Proxies Sidecar**: Os proxies são implantados ao lado de cada instância de microserviço (como contêineres ou pods). Eles interceptam e gerenciam todo o tráfego de entrada e saída dos microserviços, permitindo o controle granular sobre as comunicações. O Envoy é um proxy popular usado em muitas implementações de service mesh, incluindo Istio.

 - **Plano de Dados**: Consiste nos proxies sidecar que manipulam o tráfego entre microserviços. Eles implementam as políticas de roteamento, segurança, e observabilidade definidas pelo plano de controle.

 - **Plano de Controle**: Componente central que gerencia e distribui políticas e configurações para os proxies sidecar. Ele coleta métricas, configura roteamento de tráfego e aplica políticas de segurança e resiliência. No caso do Istio, o Istiod serve como plano de controle.

Dessa forma, a ideia é adotar uma arquitetura de service mesh (como Istio) para gerenciar a comunicação entre microserviços, onde o plano de dados cuida do load balancing, roteamento, segurança e monitoramento.

## Considerações

### Headless Service
 - **Prós**: Simplicidade, controle direto do client, menor latência
 - **Contras**: Escalabilidade limitada, no caso de um auto-scaling, o client grpc precisaria ser reconstruído para considerar um novo pod.

### Istio
 - **Prós**: Funcionalidades mais avançadas, gestão centralizada (configuração e políticas), observabilidade, resiliencia e segurança.
  - **Contras**: Overhead de performance, *know-how* da equipe que irá implantar e operar.