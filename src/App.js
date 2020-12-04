import './App.css';
import React from 'react';
import { Registerer, UserAgent, SessionState } from 'sip.js';


const server = 'wss://portal.snapcom.com:9002';

const transportOptions = {
  server
}

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      user: '',
      pass: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

  }

  handleChange(event, text) {
    if (text === 'user') {
      this.setState({ user: event.target.value });
    } else {
      this.setState({ pass: event.target.value });
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.submit(this.state.user, this.state.pass);
  }

  render = () => (
    <form onSubmit={this.handleSubmit}>
      <label>
        Username:
        <input
          type="text"
          value={this.state.value}
          onChange={(e) => this.handleChange(e, 'user')}
        />
      </label>
      <label>
        Password:
        <input
          type="password"
          value={this.state.value}
          onChange={(e) => this.handleChange(e, 'pass')}
        />
      </label>
      <input type="submit" value="Submit" />
    </form>
  );

}


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      user: null,
      registerer: null,
      session: null,
      video: null,
    };

    this.login = this.login.bind(this);
  }

  setupRemoteMedia(session) {
    const mediaElement = document.getElementById('remoteVideo');
    const remoteStream = new MediaStream();
    session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track) {
        remoteStream.addTrack(receiver.track);
      }
    });
    mediaElement.srcObject = remoteStream;
    mediaElement.play();
  }

  onInvite(invitation) {
    invitation.stateChange.addListener((state) => {
      console.log(`Session state changed to ${state}`);
      switch (state) {
        case SessionState.Initial:
          break;
        case SessionState.Establishing:
          break;
        case SessionState.Established:
          this.setupRemoteMedia(invitation);
          break;
        case SessionState.Terminating:
        // fall through
        case SessionState.Terminated:
          //cleanupMedia();
          break;
        default:
          throw new Error("Unknown session state.");
      }
    });
    invitation.accept();
  }

  login(username, pass) {
    const userAgentOptions = {
      authorizationPassword: pass,
      authorizationUsername: username,
      delegate: {
        onInvite: this.onIntive,
      },
      transportOptions,
      uri: UserAgent.makeURI('sip:' + username),
      hackWssInTransport: true,
    };
    const userAgent = new UserAgent(userAgentOptions);
    const registerer = new Registerer(userAgent);
    userAgent.start().then(() => {
      registerer.register();
    });
    this.setState({ user: userAgent, registerer });

    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(mediaStream => {
        //this.setState({ user: 'a' });
        var video = document.getElementById('localVideo');
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => { video.play(); };
      })
      .catch(e => {
        console.log(e.name + ': ' + e.message);
      });
  }

  render() {
    const body =
      this.state.user === null ? (<Login submit={this.login} />)
        : (<div className="video">
          <video id="remoteVideo"></video>
          <video
            id="localVideo"
            muted="muted"
            autoPlay={true}
          ></video>
        </div>);
    return (
      <div className="App">
        {body}
      </div>
    );
  }
}

export default App;
