# Extend the pre-built 4g3n7-desktop image
FROM ghcr.io/4g3n7/4g3n7-desktop:edge

# Add additional packages, applications, or customizations here

# Expose the 4g3n7d service port
EXPOSE 9990

# Start the 4g3n7d service
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf", "-n"]
