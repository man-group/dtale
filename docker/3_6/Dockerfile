FROM external-sandbox.docker.prod.num/continuumio/anaconda3:latest as build

COPY . /workspace

RUN set -eux \
  ; cd /workspace \
  ; . /root/.bashrc \
  ; pip install six \
  ; pip install lxml \
  ; pip install coveralls \
  ; pip install isort \
  ; pip install -r docs/source/requirements.txt \
  ; python setup.py develop \
  ; isort --recursive -c -vb setup.py dtale tests \
  ; export TZ=America/New_York \
  ; python setup.py test \
  ; python setup.py build_sphinx \
  ; python setup.py bdist_egg

FROM http://hub.docker.com/u/continuumio/anaconda3:latest as app

RUN mkdir /app

COPY --from=build /workspace/dist/*.egg /app/

WORKDIR /app

RUN set -eux \
  ; . /root/.bashrc \
  ; easy_install dtale-0.0.1-py3.7.egg
