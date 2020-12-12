import React, { Component } from 'react';
import { Form, Message, Select } from 'semantic-ui-react';
import { authAxios } from '../utils';
import { addressCreateURL, addressUpdateURL } from '../constants';


const UPDATE_FORM = 'UPDATE_FORM';

class AddressForm extends Component {

  state = {
    loading: false,
    error: null,
    formData: {
      address_type: "",
      apartment_address: "",
      country: "",
      default: false,
      id: '',
      street_address: "",
      user: '',
      zip: "",
    },
    saving: false,
    success: false,
  }

  handleChange = e => {
    const { formData } = this.state;
    const updatedFormData = {
      ...formData,
      [e.target.name]: e.target.value
    }

    this.setState({ formData: updatedFormData });
  }

  handleSelectChange = (e, { name, value }) => {
    const { formData } = this.state;
    const updatedFormData = {
      ...formData,
      [name]: value
    }

    this.setState({ formData: updatedFormData });
  }

  handleToggleDefault = e => {
    const { formData } = this.state;
    const updatedFormData = {
      ...formData,
      default: !formData.default
    }

    this.setState({ formData: updatedFormData });
  }

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ saving: true });

    const { formType } = this.props;
    if (formType === UPDATE_FORM) {
      this.handleUpdateAddress();
    } else {
      this.handleAddressCreate();
    }

  }

  handleAddressCreate = () => {
    const { userID, activeItem } = this.props;
    const { formData } = this.state;

    authAxios.post(addressCreateURL, {
      ...formData,
      address_type: activeItem === 'billingAddress' ? 'B' : 'S',
      user: userID
    })
      .then(res => {
        this.setState({
          saving: false, 
          success: true, 
          formData: {
            address_type: "",
            apartment_address: "",
            country: "",
            default: false,
            id: '',
            street_address: "",
            user: '',
            zip: "",
          }
        });
        this.props.callback();
      })
      .catch(err => {
        this.setState({ error: err.response.data });
      })
  }

  handleUpdateAddress = () => {
    const { userID, activeItem } = this.props;
    const { formData } = this.state;

    authAxios.put(addressUpdateURL(formData.id), {
      ...formData,
      address_type: activeItem === 'billingAddress' ? 'B' : 'S',
      user: userID
    })
      .then(res => {
        this.setState({
          saving: false, 
          success: true, 
          formData: {
            address_type: "",
            apartment_address: "",
            country: "",
            default: false,
            id: '',
            street_address: "",
            user: '',
            zip: "",
          }
        });
        this.props.callback();
      })
      .catch(err => {
        this.setState({ error: err.response.data });
      })
  }

  componentDidMount() {
    const { address, formType } = this.props;
    if (formType === UPDATE_FORM) {
      this.setState({
        formData: address
      });
      console.log(address)
    }
  }

  render() {
    const { countries } = this.props;
    const { error, success, saving, formData } = this.state;

    return (
      <Form onSubmit={this.handleSubmit} success={success} error={error}>

        <Form.Input value={formData.street_address} required name='street_address' placeholder='Street address' onChange={this.handleChange} />

        <Form.Input value={formData.apartment_address} required name='apartment_address' placeholder='Apartment address' onChange={this.handleChange} />

        <Form.Field required>
          <Select
            loading={countries.length < 1}
            fluid
            clearable
            search
            name='country'
            value={formData.country}
            placeholder="Country"
            options={countries}
            onChange={this.handleSelectChange}
          />
        </Form.Field>

        <Form.Input value={formData.zip} required name='zip' placeholder='Zip code' onChange={this.handleChange} />

        <Form.Checkbox checked={formData.default} name='default' label='Make this the default' onChange={this.handleToggleDefault} />

        {success && (
          <Message
            success
            header="Success!"
            content={'Your address was saved.'}
          />
        )}

        {error && (
          <Message
            error
            header="Some error occured!"
            content={JSON.stringify(error)}
          />
        )}
        <Form.Button primary disabled={saving} loading={saving}>
          Save
        </Form.Button>
      </Form>

    )
  }
}

export default AddressForm;