FROM racket/racket:8.0-full

RUN useradd -m bot -d /code

# Disable all passwords for root
RUN usermod -p '!!' root 

# Create workdir after, to avoid warning when adding user
WORKDIR /code/

# Install raco tools
COPY info.rkt .
# No way to make this quiet it seems
RUN raco pkg install --auto --scope installation --no-docs /code/

COPY --chown=bot entrypoint.sh /code/
RUN chmod 500 entrypoint.sh

ENV TEST=false

# Switch to bot
USER bot

ENTRYPOINT ["/code/entrypoint.sh"]
CMD ["racket", "-t", "source.rkt"]