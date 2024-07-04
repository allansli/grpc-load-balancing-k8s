# Commands

## Com mesh
```
az aks create --resource-group rg-pocs-aks --name aks-poc-grpc-istio --node-count 1 --enable-asm --generate-ssh-keys
```
## Sem mesh
```
az aks create --resource-group rg-pocs-aks --name aks-poc-grpc-istio --node-count 1 --generate-ssh-keys
```

## Obter credenciais e revisions disponiveis pra localização
```
az aks get-credentials --resource-group rg-pocs-aks --name aks-poc-grpc-istio
az aks mesh get-revisions --location brazilsouth -o table
```

## Adicionar mesh em um já criado
```
az aks mesh enable --resource-group rg-pocs-aks --name aks-poc-grpc-istio
```

## Validar instalação do mesh
```
az aks show --resource-group rg-pocs-aks --name aks-poc-grpc-istio  --query "serviceMeshProfile.mode"
kubectl get pods -n aks-istio-system
az aks show --resource-group rg-pocs-aks --name aks-poc-grpc-istio --query "serviceMeshProfile.istio.revisions"
```

## Tag no namespace
```
kubectl label namespace default istio.io/rev=asm-1-20
```

# Building images 

## Client
```
docker build -t grpc-client .
docker tag grpc-client:latest allansli/grpc-client:latest
docker push allansli/grpc-client:latest
```

## Server
```
docker build -t grpc-server .
docker tag grpc-server:latest allansli/grpc-server:latest
docker push allansli/grpc-server:latest
```