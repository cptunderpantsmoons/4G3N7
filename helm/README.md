# 4G3N7 Helm Charts

This directory contains Helm charts for deploying 4G3N7 on Kubernetes.

## Documentation

For complete deployment instructions, see:
**[Helm Deployment Guide](https://docs.4g3n7.ai/deployment/helm)**

## Quick Start

```bash
# Clone repository
git clone https://github.com/4g3n7-ai/4g3n7.git
cd 4g3n7

# Create values.yaml with your API key(s)
cat > values.yaml <<EOF
4g3n7-agent:
  apiKeys:
    anthropic:
      value: "sk-ant-your-key-here"
EOF

# Install
helm install 4g3n7 ./helm --namespace 4g3n7 --create-namespace -f values.yaml

# Access
kubectl port-forward -n 4g3n7 svc/4g3n7-ui 9992:9992
```

Access at: http://localhost:9992

## Structure

```
helm/
├── Chart.yaml              # Main chart
├── values.yaml             # Default values
├── values-proxy.yaml       # LiteLLM proxy configuration
├── templates/              # Kubernetes templates
└── charts/                 # Subcharts
    ├── 4g3n7-desktop/    # Desktop VNC service
    ├── 4g3n7-agent/      # Backend API service
    ├── 4g3n7-ui/         # Frontend UI service
    ├── 4g3n7-llm-proxy/  # Optional LiteLLM proxy
    └── postgresql/         # PostgreSQL database
```