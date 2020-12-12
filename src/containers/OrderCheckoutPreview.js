import React, { Component } from 'react';
import { Container, Header, Item, Label } from 'semantic-ui-react'


class OrderCheckoutPreview extends Component {

  renderVariations = orderItem => {
    let text = '';
    orderItem.item_variations.forEach(iv => {
      text += `${iv.variation.name}: ${iv.value}, `
    });

    return text;
  }

  render() {
    const { data } = this.props;

    return (
      <Container>
        <Header as="h3">Order Summary</Header>
        {data && data.order_items.map(order_item => (
          <Item.Group relaxed key={order_item.id}>
            <Item>
              <Item.Image size='tiny' src={`http://127.0.0.1:8000${order_item.item.image}`} />

              <Item.Content verticalAlign='middle'>
                <Item.Header as='a'>{order_item.quantity} x {order_item.item.title} - {this.renderVariations(order_item)}</Item.Header>
                <Item.Extra>
                  <Label>${order_item.final_price.toFixed(2)}</Label>
                </Item.Extra>
              </Item.Content>
            </Item>
          </Item.Group>
        ))}
        {data && (
          <Item.Group>
            <Item>
              <Item.Content>
                <Item.Header as='a'>
                  Order Total: ${data.total.toFixed(2)}
                  {data.coupon && <Label style={{marginLeft: '1rem'}} color='green'>Current coupon: {data.coupon.code} for ${data.coupon.amount}</Label>}
                </Item.Header>
              </Item.Content>
            </Item>
          </Item.Group>
        )}
      
      </Container>
    )
  }
}

export default OrderCheckoutPreview;